/**
 * Suno-style edits (extend, replace section, restyle) of a library song. Every result is a NEW
 * song with parent_id; the original files are never written.
 *
 * Runner support, checked Nov 2026:
 * - Self-hosted engine, ace-step-1.5: per the task list in GET /v1/health (protocol v1).
 * - fal ACE-Step v1 edit endpoints (Apache-2.0). fal has no 1.5 edit endpoints (fal-ai/ace-step-1.5/
 *   {audio-to-audio,extend,inpaint} return 404). Schemas from
 *   https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/ace-step/<endpoint>:
 *     audio-outpaint: tags, lyrics, audio_url, extend_before_duration, extend_after_duration (0..107 each)
 *     audio-inpaint:  tags, lyrics, audio_url, start_time, end_time (0..240), *_relative_to, variance
 *     audio-to-audio: tags, original_tags, lyrics, original_lyrics, audio_url, edit_mode (remix|lyrics)
 *   audio_url accepts a base64 data URI (fal file inputs); never run live.
 * - Replicate visoar/ace-step-1.5@fd851bae: input fields are only caption, lyrics, duration,
 *   batch_size, poll_interval, timeout_seconds; no source audio or task type, so no edits.
 */
import {
  type EditAction,
  type EditRequest,
  type EngineAudioFormat,
  type EngineHealth,
  type EngineTask,
  type SongKind,
  type SongMeta,
  type StudioEditInfo,
  type StudioJob,
  type StudioRunnerRecord
} from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { falFailure, falHeaders, isFalRequestId, type FalDeps } from '../music/fal';
import { assertJobCapacity, publicJob, recordJob, type JobContext, type JobTask } from './jobs';
import { ffmpegPath } from './master';
import { RunnerRefused, submitEngineJob, type EngineDeps } from './runners/engine';
import { sharedHealth, type HealthCache } from './runners/router';
import type { RunnerAttempt } from './runners/router';

const engineTask: Record<EditAction, EngineTask> = {
  extend: 'extend',
  repaint: 'repaint',
  cover: 'cover'
};
const songKind: Record<EditAction, SongKind> = {
  extend: 'extend',
  repaint: 'repaint',
  cover: 'restyle'
};
const falEndpoint: Record<EditAction, string> = {
  extend: 'fal-ai/ace-step/audio-outpaint',
  repaint: 'fal-ai/ace-step/audio-inpaint',
  cover: 'fal-ai/ace-step/audio-to-audio'
};
export const falEditApp = 'fal-ai/ace-step';
export const editCosts: Record<EditAction, number> = { extend: 0.05, repaint: 0.03, cover: 0.05 };
const maxEngineSource = 50 * 1024 * 1024;
const maxFalSource = 25 * 1024 * 1024;
const replicateReason =
  'Replicate visoar/ace-step-1.5 has no source-audio or task inputs (only caption, lyrics, duration)';

export interface EditDeps extends JobContext {
  engine?: EngineDeps | null;
  /** Measures a file's duration in seconds; ffmpeg by default (injected in tests). */
  probe?: (file: string) => Promise<number | null>;
  /** How long the probe may take before the duration counts as unknown (default 15 s). */
  probeTimeoutMs?: number;
}

/** Duration from ffmpeg's banner ("Duration: 00:02:03.45"); null when ffmpeg cannot tell. */
export async function ffmpegDuration(file: string): Promise<number | null> {
  const proc = Bun.spawn([ffmpegPath, '-hide_banner', '-i', file], {
    stdout: 'ignore',
    stderr: 'pipe'
  });
  const kill = setTimeout(() => proc.kill(), 15_000);
  try {
    const text = await new Response(proc.stderr).text();
    await proc.exited;
    return parseDuration(text);
  } finally {
    clearTimeout(kill);
  }
}

/** Runs a duration probe with a time limit; any failure or timeout means "unknown" (null). */
export async function boundedProbe(
  probe: (file: string) => Promise<number | null>,
  file: string,
  ms: number
): Promise<number | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    const seconds = await Promise.race([probe(file).catch(() => null), timeout]);
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  } finally {
    clearTimeout(timer);
  }
}

export function parseDuration(text: string): number | null {
  const m = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(text);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

function sourceFormat(contentType: string): EngineAudioFormat | null {
  if (contentType === 'audio/wav' || contentType === 'audio/x-wav') return 'wav';
  if (contentType === 'audio/flac') return 'flac';
  if (contentType === 'audio/mpeg') return 'mp3';
  return null;
}

interface Candidate {
  kind: 'engine' | 'fal' | 'replicate';
  model_version: string;
  license: string;
  reason: string | null;
}

/** Each runner for an edit, in preference order, with why it cannot take it (null = it can). */
export async function editCandidates(
  deps: EditDeps,
  action: EditAction,
  request?: EditRequest,
  cache: HealthCache = {}
): Promise<Candidate[]> {
  let health: EngineHealth | null = null;
  let engineReason: string | null = null;
  if (!deps.engine) engineReason = 'needs VBM_ENGINE_URL and VBM_ENGINE_TOKEN';
  else {
    try {
      health = await sharedHealth(deps.engine, cache);
    } catch (error) {
      engineReason = error instanceof ProviderError ? error.publicMessage : 'engine unreachable';
    }
  }
  if (health) {
    const info = health.models.find((m) => m.id === 'ace-step-1.5');
    if (!info) engineReason = 'engine does not serve ace-step-1.5';
    else if (!info.ready) engineReason = info.reason || 'ace-step-1.5 is not ready on the engine';
    else if (!info.tasks.includes(engineTask[action]))
      engineReason = 'the engine does not offer ' + engineTask[action] + ' for ace-step-1.5';
  }
  let falReason: string | null = deps.fal ? null : 'needs FAL_KEY';
  if (!falReason && request?.action === 'extend') {
    const e = request.extend ?? {};
    if ((e.before_seconds ?? 0) > 107 || (e.after_seconds ?? 0) > 107)
      falReason = 'fal extends at most 107 s on each side';
  }
  if (!falReason && request?.action === 'repaint' && request.repaint!.end_seconds > 240)
    falReason = 'fal repaints within the first 240 s only';
  return [
    {
      kind: 'engine',
      model_version: 'ACE-Step 1.5 (self-hosted)',
      license: 'MIT',
      reason: engineReason
    },
    {
      kind: 'fal',
      model_version: 'ACE-Step v1 (' + falEndpoint[action] + ')',
      license: 'Apache-2.0',
      reason: falReason
    },
    {
      kind: 'replicate',
      model_version: 'visoar/ace-step-1.5@fd851bae',
      license: 'MIT',
      reason: replicateReason
    }
  ];
}

/** Which edits a song can have now (and why not). */
export async function editInfos(deps: EditDeps, song: SongMeta): Promise<StudioEditInfo[]> {
  const out: StudioEditInfo[] = [];
  const cache: HealthCache = {};
  for (const action of ['extend', 'repaint', 'cover'] as const) {
    let reason: string | null = null;
    if (!song.audio) reason = 'This song has no audio to edit.';
    else if (!sourceFormat(song.audio.content_type)) reason = 'Edits need WAV, FLAC or MP3 audio.';
    const candidates = await editCandidates(deps, action, undefined, cache);
    const first = reason ? undefined : candidates.find((c) => !c.reason);
    out.push({
      action,
      available: !!first,
      runner: first?.kind ?? null,
      model_version: first?.model_version ?? null,
      reason: first
        ? null
        : (reason ?? candidates.map((c) => c.kind + ': ' + c.reason).join('; ') + '.')
    });
  }
  return out;
}

/** Engine job body for an edit (protocol v1). */
export function engineEditBody(
  request: EditRequest,
  parent: SongMeta,
  source: { data_b64: string; format: EngineAudioFormat }
) {
  return {
    model: 'ace-step-1.5' as const,
    task: engineTask[request.action],
    prompt: (request.prompt?.trim() || parent.prompt).slice(0, 2000),
    ...(request.lyrics?.trim()
      ? { lyrics: request.lyrics }
      : parent.lyrics
        ? { lyrics: parent.lyrics.slice(0, 6000) }
        : {}),
    source_audio: source,
    ...(request.action === 'extend'
      ? {
          extend: {
            before_seconds: request.extend?.before_seconds ?? 0,
            after_seconds: request.extend?.after_seconds ?? 0
          }
        }
      : {}),
    ...(request.action === 'repaint' ? { repaint: request.repaint } : {}),
    ...(request.action === 'cover' ? { cover: { strength: request.strength ?? 0.5 } } : {})
  };
}

/** fal ACE-Step v1 body for an edit; audio_url is a data URI. */
export function falEditBody(
  request: EditRequest,
  parent: SongMeta,
  dataUri: string
): Record<string, unknown> {
  const tags = (request.prompt?.trim() || parent.prompt).slice(0, 512);
  const lyrics = request.lyrics?.trim() || parent.lyrics || '';
  if (request.action === 'extend')
    return {
      tags,
      lyrics,
      audio_url: dataUri,
      extend_before_duration: request.extend?.before_seconds ?? 0,
      extend_after_duration: request.extend?.after_seconds ?? 0
    };
  if (request.action === 'repaint')
    return {
      tags,
      lyrics,
      audio_url: dataUri,
      start_time: request.repaint!.start_seconds,
      end_time: request.repaint!.end_seconds,
      start_time_relative_to: 'start',
      end_time_relative_to: 'start',
      // fal calls it variance: how far the new section may move from the original.
      variance: Math.min(Math.max(request.strength ?? 0.5, 0), 1)
    };
  return {
    tags,
    original_tags: parent.prompt.slice(0, 512),
    lyrics,
    original_lyrics: parent.lyrics ?? '',
    audio_url: dataUri,
    edit_mode: 'remix'
  };
}

async function submitFalEdit(
  fal: FalDeps,
  action: EditAction,
  body: Record<string, unknown>
): Promise<string> {
  const response = await fal.fetch('https://queue.fal.run/' + falEndpoint[action], {
    method: 'POST',
    headers: falHeaders(fal.apiKey),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000)
  });
  if (!response.ok) {
    const error = await falFailure(response, 'submit');
    throw new RunnerRefused(error.status, error.publicMessage, error.logDetail);
  }
  const data = (await response.json()) as { request_id?: unknown };
  if (typeof data.request_id !== 'string' || !isFalRequestId(data.request_id))
    throw new ProviderError(502, 'fal returned an unexpected response.', 'fal edit request_id');
  return data.request_id.toLowerCase();
}

/** Starts an edit; falls back to the next runner only when one refused before a job existed. */
export async function startEdit(
  deps: EditDeps,
  parentId: string,
  request: EditRequest
): Promise<StudioJob> {
  const parent = await deps.library.get(parentId);
  if (!parent.audio) throw new ProviderError(422, 'This song has no audio to edit.');
  const format = sourceFormat(parent.audio.content_type);
  if (!format) throw new ProviderError(422, 'Edits need WAV, FLAC or MP3 audio.');
  const audio = await deps.library.audioFile(parent.id, 'main');
  // Extend and restyle work without a known length; only repaint needs it to check the range.
  const seconds = await boundedProbe(
    deps.probe ?? ffmpegDuration,
    audio.file,
    deps.probeTimeoutMs ?? 15_000
  );
  if (request.action === 'repaint') {
    if (seconds === null) throw new ProviderError(503, 'Could not measure the song (ffmpeg).');
    if (request.repaint!.end_seconds > seconds + 0.05)
      throw new ProviderError(422, 'The section ends after the song does.');
  }
  await assertJobCapacity(deps);

  const bytes = new Uint8Array(await Bun.file(audio.file).arrayBuffer());
  const attempts: RunnerAttempt[] = [];
  let task: JobTask | null = null;
  let used: Candidate | null = null;
  for (const c of await editCandidates(deps, request.action, request)) {
    if (!c.reason && c.kind === 'engine' && bytes.length > maxEngineSource)
      c.reason = 'song is larger than the engine accepts (50 MiB)';
    if (!c.reason && c.kind === 'fal' && bytes.length > maxFalSource)
      c.reason = 'song is too large to send to fal (25 MiB)';
    if (c.reason) {
      attempts.push({ runner: c.kind, model_version: c.model_version, outcome: c.reason });
      continue;
    }
    try {
      const b64 = Buffer.from(bytes).toString('base64');
      if (c.kind === 'engine') {
        const job = await submitEngineJob(
          deps.engine!,
          engineEditBody(request, parent, { data_b64: b64, format }),
          crypto.randomUUID()
        );
        task = { provider: 'engine', prediction_id: job.id, take: 1, status: 'running' };
      } else {
        const id = await submitFalEdit(
          deps.fal!,
          request.action,
          falEditBody(request, parent, 'data:' + parent.audio.content_type + ';base64,' + b64)
        );
        task = { provider: 'fal', prediction_id: id, app: falEditApp, take: 1, status: 'running' };
      }
      attempts.push({ runner: c.kind, model_version: c.model_version, outcome: 'submitted' });
      used = c;
      break;
    } catch (error) {
      if (!(error instanceof RunnerRefused)) throw error;
      attempts.push({
        runner: c.kind,
        model_version: c.model_version,
        outcome: 'refused: ' + error.publicMessage
      });
    }
  }
  if (!task || !used)
    throw new ProviderError(
      503,
      'No runner can do this edit: ' +
        attempts.map((a) => a.runner + ' (' + a.outcome + ')').join('; ')
    );
  const record: StudioRunnerRecord = {
    model: 'ace-step-1.5',
    runner: used.kind,
    model_version: used.model_version,
    license: used.license,
    commercial: true,
    attempts
  };
  const label = { extend: 'extended', repaint: 'section replaced', cover: 'restyled' }[
    request.action
  ];
  const job = await recordJob(
    deps,
    'edit',
    {
      title: request.title?.trim() || parent.title + ' — ' + label,
      prompt: request.prompt?.trim() || parent.prompt,
      style_tags: parent.style_tags,
      lyrics: request.lyrics?.trim() || parent.lyrics,
      engine: 'ace-step-1.5',
      params: {
        edit: request.action,
        runner: used.kind,
        model_version: used.model_version,
        source_seconds: seconds,
        ...(request.action === 'extend'
          ? {
              before_seconds: request.extend?.before_seconds ?? 0,
              after_seconds: request.extend?.after_seconds ?? 0
            }
          : {}),
        ...(request.action === 'repaint'
          ? {
              start_seconds: request.repaint!.start_seconds,
              end_seconds: request.repaint!.end_seconds
            }
          : {}),
        ...(request.action === 'cover'
          ? { strength: request.strength ?? 0.5, strength_applied: used.kind === 'engine' }
          : {})
      },
      parent_id: parent.id,
      kind: songKind[request.action],
      est_cost_usd: editCosts[request.action],
      runner: record
    },
    [task]
  );
  return publicJob(job);
}
