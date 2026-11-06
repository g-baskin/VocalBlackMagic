import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { VoiceModel } from '@vbm/contracts';
import {
  buildPolishChain,
  gainArgs,
  isPresetId,
  loudnessGainDb,
  polishArgs,
  presets,
  regressionFinding,
  regressions,
  type PresetId
} from './chain';
import {
  diagnoseFile,
  parseEbur128,
  parseSilences,
  SILENCE_FILTER,
  type Diagnosis
} from './diagnose';
import { VocalFixError } from './errors';
import {
  buildZip,
  datasetEntryName,
  validateConsent,
  VoiceRegistry,
  type ConsentInput
} from './forge';
import {
  assemblyArgs,
  layoutSegments,
  measurePhrase,
  phrasesFromSilences,
  rankPhrases,
  selectPhrases,
  type GoldSegment,
  type PhraseCandidate,
  type RankedPhrase
} from './gold';
import { JobRunner, type Job, type JobContext } from './jobs';
import { analyze, decodePcm, ffmpeg, MAX_UPLOAD_BYTES, probeAndVerify } from './media';
import { analyzeProfile, describeProfile } from './profile';
import { MODELS, outputUrl, ReplicateClient } from './replicate';
import {
  sha256,
  SessionStore,
  type DerivedVersion,
  type Manifest,
  type Recording,
  type SessionMode
} from './storage';

export const RIGHTS_STATEMENT =
  'I am the performer or have the performer’s permission, and I hold the rights to process these recordings.';
const EXTENSIONS = /\.(wav|mp3|flac|m4a|ogg|opus|aac|webm)$/i;
const MAX_OUTPUT_BYTES = 200 * 1024 * 1024;

export interface IntakeFile {
  name: string;
  bytes: Uint8Array;
}

export interface GoldResult {
  version: DerivedVersion;
  phrases: RankedPhrase[];
  selected: string[];
  segments: GoldSegment[];
  profile: Record<string, string>;
}

export class VocalFixService {
  readonly store: SessionStore;
  readonly registry: VoiceRegistry;
  readonly jobs: JobRunner;

  constructor(
    dataDir: string,
    private readonly replicateToken: () => string | null,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => Date = () => new Date(),
    private readonly pollMs = 2000
  ) {
    this.store = new SessionStore(dataDir);
    this.registry = new VoiceRegistry(dataDir);
    this.jobs = new JobRunner(join(dataDir, 'vocal-fix', 'jobs'), now);
    void this.jobs.recover();
  }

  private replicate(): ReplicateClient {
    const token = this.replicateToken();
    if (!token)
      throw new VocalFixError(
        'REPLICATE_API_TOKEN is not configured; hosted stages are unavailable.',
        503
      );
    return new ReplicateClient(token, this.fetchImpl);
  }

  hostedReady(): boolean {
    return !!this.replicateToken();
  }

  async intake(input: {
    mode: unknown;
    performer: unknown;
    acknowledged_rights: unknown;
    files: IntakeFile[];
  }): Promise<Manifest> {
    const mode =
      input.mode === 'fix' || input.mode === 'forge' ? (input.mode as SessionMode) : null;
    if (!mode) throw new VocalFixError('Mode must be "fix" or "forge".', 422);
    if (input.acknowledged_rights !== true)
      throw new VocalFixError('Performer authorization and recording rights are required.', 403);
    const performer = typeof input.performer === 'string' ? input.performer.trim() : '';
    if (performer.length < 2 || performer.length > 120)
      throw new VocalFixError('Enter the performer’s full name.', 422);
    const expected = mode === 'fix' ? 1 : 5;
    if (input.files.length !== expected)
      throw new VocalFixError(
        mode === 'fix'
          ? 'Fix a take needs exactly one recording.'
          : 'Forge a Gold Vocal needs exactly five recordings.',
        422
      );
    for (const f of input.files) {
      if (!EXTENSIONS.test(f.name))
        throw new VocalFixError('Unsupported file type: ' + f.name.slice(0, 80), 415);
      if (f.bytes.byteLength < 1024)
        throw new VocalFixError('File too small to be audio: ' + f.name.slice(0, 80), 422);
      if (f.bytes.byteLength > MAX_UPLOAD_BYTES)
        throw new VocalFixError('Each recording must be 100 MB or smaller.', 413);
    }
    const at = this.now().toISOString();
    const manifest = await this.store.create({
      mode,
      performer,
      created_at: at,
      consent: { acknowledged_rights: true, statement: RIGHTS_STATEMENT, attested_at: at },
      recordings: []
    });
    try {
      for (const [i, f] of input.files.entries()) {
        const id = 'take-' + (i + 1);
        const stored = id + extname(f.name).toLowerCase();
        const path = this.store.filePath(manifest.id, 'originals', stored);
        await writeFile(path, f.bytes, { flag: 'wx' });
        let probe;
        try {
          probe = await probeAndVerify(path);
        } catch (error) {
          throw new VocalFixError(
            f.name.slice(0, 80) + ': ' + (error instanceof Error ? error.message : 'invalid audio'),
            422
          );
        }
        manifest.recordings.push({
          id,
          index: i + 1,
          original_name: f.name.slice(0, 200),
          stored_name: stored,
          bytes: f.bytes.byteLength,
          sha256: sha256(f.bytes),
          probe,
          integrity_verified: true
        });
      }
      manifest.audit.push({
        at,
        event: 'intake',
        detail: { files: manifest.recordings.length, rights_statement: RIGHTS_STATEMENT }
      });
      await this.store.write(manifest);
      return manifest;
    } catch (error) {
      await rm(this.store.sessionDir(manifest.id), { recursive: true, force: true });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const m = await this.store.read(id);
    this.jobs.cancelSession(id);
    await this.jobs.idle(id);
    await this.jobs.removeSession(id);
    for (const voice of m.voices) await this.revokeVoiceFiles(voice);
    await this.store.remove(id);
  }

  originalPath(m: Manifest, r: Recording): string {
    return this.store.filePath(m.id, 'originals', r.stored_name);
  }

  latestRepair(m: Manifest, takeId: string): DerivedVersion | undefined {
    return m.versions.filter((v) => v.kind === 'repair' && v.source_ids[0] === takeId).at(-1);
  }

  async diagnose(id: string): Promise<Manifest> {
    const m = await this.store.read(id);
    const results = await Promise.all(
      m.recordings.map((r) =>
        diagnoseFile(this.originalPath(m, r), r.probe.duration_seconds, this.now())
      )
    );
    return this.store.update(id, (cur) => {
      cur.recordings.forEach((r, i) => (r.diagnosis = results[i]));
      return cur;
    });
  }

  private async saveDerived(
    sessionId: string,
    name: string,
    bytes: Uint8Array | null,
    meta: Omit<DerivedVersion, 'file' | 'sha256' | 'bytes' | 'created_at'>
  ): Promise<DerivedVersion> {
    const path = this.store.filePath(sessionId, 'derived', name);
    if (bytes) await writeFile(path, bytes, { flag: 'wx' });
    const data = bytes ?? new Uint8Array(await readFile(path));
    const version: DerivedVersion = {
      ...meta,
      file: name,
      sha256: sha256(data),
      bytes: data.byteLength,
      created_at: this.now().toISOString()
    };
    await this.store.update(sessionId, (m) => {
      m.versions.push(version);
    });
    return version;
  }

  private async uniqueName(
    sessionId: string,
    stem: string,
    kind: DerivedVersion['kind'],
    ext: string
  ): Promise<string> {
    for (let n = 1; n < 1000; n++) {
      const name = stem + '.' + kind + '.v' + n + ext;
      try {
        await stat(this.store.filePath(sessionId, 'derived', name));
      } catch {
        return name;
      }
    }
    throw new VocalFixError('Too many versions.', 409);
  }

  private async hosted(
    ctx: JobContext,
    model: keyof typeof MODELS,
    inputPath: string,
    inputField: string,
    extra: Record<string, unknown>,
    pick: (output: unknown) => string | null
  ): Promise<{ bytes: Uint8Array; prediction_id: string }> {
    const client = this.replicate();
    const bytes = new Uint8Array(await readFile(inputPath));
    const url = await client.uploadFile(
      bytes,
      'input' + extname(inputPath),
      'audio/wav',
      ctx.signal
    );
    const created = await client.create(
      MODELS[model].version,
      { [inputField]: url, ...extra },
      ctx.signal
    );
    const done = await client.wait(created, { signal: ctx.signal, intervalMs: this.pollMs });
    const out = pick(done.output);
    if (!out) throw new VocalFixError(MODELS[model].ref + ' returned no audio.', 502);
    return {
      bytes: await client.download(out, MAX_OUTPUT_BYTES, ctx.signal),
      prediction_id: done.id
    };
  }

  async startRepair(id: string, body: Record<string, unknown>): Promise<Job> {
    const m = await this.store.read(id);
    const preset = body.preset ?? 'natural';
    if (!isPresetId(preset)) throw new VocalFixError('Unknown preset.', 422);
    const isolate = body.isolate === true;
    const enhance = body.enhance === true;
    if ((isolate || enhance) && !this.hostedReady()) this.replicate();
    const requested = Array.isArray(body.take_ids) ? body.take_ids : m.recordings.map((r) => r.id);
    const takes = m.recordings.filter((r) => requested.includes(r.id));
    if (!takes.length) throw new VocalFixError('No matching takes.', 422);
    const stages = [
      ...(isolate ? [{ id: 'isolate', label: 'Isolate vocal (Demucs)' }] : []),
      ...(enhance ? [{ id: 'enhance', label: 'AI denoise + enhance' }] : []),
      { id: 'polish', label: presets[preset].name + ' polish' },
      { id: 'rediagnose', label: 'Re-diagnose' }
    ];
    return this.jobs.start(this.store.sessionDir(id), id, 'repair', stages, (ctx) =>
      this.runRepair(m, takes, preset, isolate, enhance, ctx)
    );
  }

  private async runRepair(
    m: Manifest,
    takes: Recording[],
    preset: PresetId,
    isolate: boolean,
    enhance: boolean,
    ctx: JobContext
  ): Promise<Record<string, unknown>> {
    const results: Record<string, unknown>[] = [];
    const work = takes.map((t) => ({
      take: t,
      path: this.originalPath(m, t),
      steps: [] as DerivedVersion['provenance']
    }));
    // Compressed originals (browser WebM/Opus, OGG, M4A, MP3) are transcoded to a job-owned
    // temporary WAV first so every stage works on PCM; only these exact paths are removed after.
    const transcoded: string[] = [];
    try {
      for (const w of work) {
        if (extname(w.path).toLowerCase() === '.wav') continue;
        const tmp = this.store.filePath(
          m.id,
          'derived',
          w.take.id + '.transcode-' + randomUUID().slice(0, 8) + '.tmp.wav'
        );
        transcoded.push(tmp);
        await ffmpeg(['-i', w.path, '-ar', '48000', '-c:a', 'pcm_s24le', tmp], ctx.signal);
        w.path = tmp;
        w.steps.push({ step: 'transcode', tool: 'ffmpeg' });
      }
      return await this.runStages(m, work, preset, isolate, enhance, ctx, results);
    } finally {
      for (const tmp of transcoded) await rm(tmp, { force: true });
    }
  }

  private async runStages(
    m: Manifest,
    work: { take: Recording; path: string; steps: DerivedVersion['provenance'] }[],
    preset: PresetId,
    isolate: boolean,
    enhance: boolean,
    ctx: JobContext,
    results: Record<string, unknown>[]
  ): Promise<Record<string, unknown>> {
    if (isolate) {
      await ctx.stage('isolate', 'active');
      for (const w of work) {
        await ctx.detail('Isolating vocal of ' + w.take.id);
        const out = await this.hosted(
          ctx,
          'demucs',
          w.path,
          'audio',
          { isolate_stem: 'vocals', format: 'wav' },
          (o) => outputUrl(o, 'vocals')
        );
        const name = await this.uniqueName(m.id, w.take.id, 'isolate', '.wav');
        w.steps.push({
          step: 'isolate',
          tool: 'replicate',
          model: MODELS.demucs.ref + ':' + MODELS.demucs.version,
          prediction_id: out.prediction_id
        });
        await this.saveDerived(m.id, name, out.bytes, {
          id: name,
          kind: 'isolate',
          source_ids: [w.take.id],
          params: { isolate_stem: 'vocals' },
          provenance: [...w.steps]
        });
        w.path = this.store.filePath(m.id, 'derived', name);
      }
      await ctx.stage('isolate', 'done');
    }
    if (enhance) {
      await ctx.stage('enhance', 'active');
      for (const w of work) {
        await ctx.detail('Enhancing ' + w.take.id);
        const wav = this.store.filePath(
          m.id,
          'derived',
          await this.uniqueName(m.id, w.take.id, 'enhance', '.in.wav')
        );
        await ffmpeg(
          ['-i', w.path, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', wav],
          ctx.signal
        );
        try {
          const out = await this.hosted(
            ctx,
            'enhance',
            wav,
            'input_audio',
            {
              denoise_flag: true,
              solver: 'Midpoint',
              number_function_evaluations: 64,
              prior_temperature: 0.5
            },
            (o) =>
              Array.isArray(o)
                ? typeof o.at(-1) === 'string'
                  ? (o.at(-1) as string)
                  : null
                : outputUrl(o)
          );
          const name = await this.uniqueName(m.id, w.take.id, 'enhance', '.wav');
          w.steps.push({
            step: 'enhance',
            tool: 'replicate',
            model: MODELS.enhance.ref + ':' + MODELS.enhance.version,
            prediction_id: out.prediction_id
          });
          await this.saveDerived(m.id, name, out.bytes, {
            id: name,
            kind: 'enhance',
            source_ids: [w.take.id],
            params: { denoise_flag: true },
            provenance: [...w.steps]
          });
          w.path = this.store.filePath(m.id, 'derived', name);
        } finally {
          await rm(wav, { force: true });
        }
      }
      await ctx.stage('enhance', 'done');
    }
    await ctx.stage('polish', 'active');
    for (const w of work) {
      await ctx.detail('Polishing ' + w.take.id);
      const before = w.take.diagnosis as Diagnosis | undefined;
      // After hosted stages the original diagnosis no longer describes the audio.
      const diag = isolate || enhance ? undefined : before;
      const name = await this.uniqueName(m.id, w.take.id, 'repair', '.wav');
      const out = this.store.filePath(m.id, 'derived', name);
      let attempt = await this.polishOnce(m.id, w.path, out, preset, diag, 0, ctx);
      let worse = regressions(before?.scores, attempt.after.scores);
      let retried = false;
      if (worse.length) {
        // Never worse: try one stronger variant, keep it only if it regresses less.
        await ctx.detail('Stronger pass for ' + w.take.id);
        retried = true;
        const alt = this.store.filePath(m.id, 'derived', name.replace(/\.wav$/, '.alt.tmp.wav'));
        try {
          const strong = await this.polishOnce(m.id, w.path, alt, preset, diag ?? before, 1, ctx);
          const strongWorse = regressions(before?.scores, strong.after.scores);
          if (
            strongWorse.length < worse.length ||
            (strongWorse.length === worse.length &&
              strong.after.scores.overall > attempt.after.scores.overall)
          ) {
            await rename(alt, out);
            attempt = strong;
            worse = strongWorse;
          }
        } finally {
          await rm(alt, { force: true });
        }
      }
      const after = attempt.after;
      for (const k of worse)
        after.findings.unshift({ severity: 'warning', text: regressionFinding(k) });
      const version = await this.saveDerived(m.id, name, null, {
        id: name,
        kind: 'repair',
        source_ids: [w.take.id],
        params: {
          preset,
          isolate,
          enhance,
          filter_chain: attempt.chain,
          makeup_gain_db: attempt.gain,
          strength: attempt.strength,
          stronger_retry: retried,
          regressed: worse
        },
        provenance: [...w.steps, { step: 'polish', tool: 'ffmpeg' }],
        diagnosis: after
      });
      results.push({
        take_id: w.take.id,
        version: version.id,
        before: before?.scores ?? null,
        after: after.scores,
        stronger_retry: retried,
        regressed: worse
      });
    }
    await ctx.stage('polish', 'done');
    await ctx.stage('rediagnose', 'active');
    await ctx.stage('rediagnose', 'done');
    return { takes: results };
  }

  /** Two-pass local polish: shaping chain, then capped static gain + limiter; returns its diagnosis. */
  private async polishOnce(
    sessionId: string,
    input: string,
    output: string,
    preset: PresetId,
    diag: Diagnosis | undefined,
    strength: 0 | 1,
    ctx: JobContext
  ): Promise<{ after: Diagnosis; chain: string; gain: number; strength: 0 | 1 }> {
    const chain = buildPolishChain(preset, diag, strength);
    const pass1 = this.store.filePath(
      sessionId,
      'derived',
      'polish-' + randomUUID().slice(0, 8) + '.tmp.wav'
    );
    let gain = 0;
    try {
      await ffmpeg(polishArgs(input, pass1, chain), ctx.signal);
      gain = loudnessGainDb(
        parseEbur128(await analyze(pass1, 'ebur128=peak=true', ctx.signal)).integrated_lufs,
        preset,
        strength
      );
      await ffmpeg(gainArgs(pass1, output, gain), ctx.signal);
    } finally {
      await rm(pass1, { force: true });
    }
    const probe = await probeAndVerify(output, ctx.signal);
    const after = await diagnoseFile(output, probe.duration_seconds, this.now(), ctx.signal);
    return { after, chain, gain, strength };
  }

  async gold(id: string, body: Record<string, unknown>): Promise<GoldResult> {
    const m = await this.store.read(id);
    if (m.mode !== 'forge')
      throw new VocalFixError('Gold Vocal needs a Forge session with five takes.', 409);
    const sources = m.recordings.map((r) => {
      const v = this.latestRepair(m, r.id);
      if (!v)
        throw new VocalFixError(
          'Repair every take before forging the Gold Vocal (' + r.id + ' has no repair).',
          409
        );
      return { take: r, version: v, path: this.store.filePath(m.id, 'derived', v.file) };
    });
    const strings = (x: unknown) =>
      Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : [];
    const candidates: PhraseCandidate[] = [];
    for (const s of sources) {
      const diag = s.version.diagnosis as Diagnosis;
      const silences = parseSilences(await analyze(s.path, SILENCE_FILTER), diag.duration_seconds);
      const pcm = await decodePcm(s.path, 48_000);
      phrasesFromSilences(silences, diag.duration_seconds).forEach((p, i) => {
        const level = measurePhrase(pcm, 48_000, p.start, p.end);
        candidates.push({
          id: s.take.id + '-p' + String(i + 1).padStart(2, '0'),
          take_id: s.take.id,
          source_file: s.version.file,
          start: p.start,
          end: p.end,
          ...level,
          snr_db: Math.round((level.rms_db - diag.noise_floor_db) * 10) / 10
        });
      });
    }
    const ranked = rankPhrases(candidates);
    const selected = selectPhrases(ranked, {
      excluded: strings(body.excluded),
      included: strings(body.included)
    });
    if (!selected.length)
      throw new VocalFixError(
        'No phrase passed the quality gate; include some phrases manually.',
        422
      );
    const segments = layoutSegments(selected);
    const inputs = new Map(sources.map((s) => [s.version.file, s.path]));
    const name = await this.uniqueName(id, 'gold', 'gold', '.wav');
    const out = this.store.filePath(id, 'derived', name);
    await ffmpeg(assemblyArgs(inputs, segments, out));
    const pcm = await decodePcm(out, 16_000);
    const profile = describeProfile(analyzeProfile(pcm, 16_000));
    const probe = await probeAndVerify(out);
    const diag = await diagnoseFile(out, probe.duration_seconds, this.now());
    const sidecar = {
      gold_file: name,
      performer: m.performer,
      created_at: this.now().toISOString(),
      method:
        'Representative dry phrases cut from repaired takes and joined with silence; no averaging or crossfading between takes.',
      segments: segments.map((s) => ({
        ...s,
        source_sha256: m.versions.find((v) => v.file === s.source_file)?.sha256,
        original: m.recordings.find((r) => r.id === s.take_id)?.stored_name
      })),
      profile
    };
    const jsonName = name.replace(/\.wav$/, '.json');
    await writeFile(
      this.store.filePath(id, 'derived', jsonName),
      JSON.stringify(sidecar, null, 2),
      { flag: 'wx' }
    );
    const version = await this.saveDerived(id, name, null, {
      id: name,
      kind: 'gold',
      source_ids: sources.map((s) => s.version.id),
      params: {
        selected: selected.map((p) => p.id),
        excluded: strings(body.excluded),
        included: strings(body.included),
        sidecar: jsonName
      },
      provenance: [{ step: 'assemble', tool: 'ffmpeg' }],
      diagnosis: diag
    });
    const gold = {
      version: version.id,
      sidecar: jsonName,
      phrases: ranked,
      selected: selected.map((p) => p.id),
      segments
    };
    await this.store.update(id, (cur) => {
      cur.gold = gold;
      cur.profile = profile;
    });
    return { version, phrases: ranked, selected: gold.selected, segments, profile };
  }

  async startForge(
    id: string,
    body: Record<string, unknown>
  ): Promise<{ job: Job; voice: VoiceModel }> {
    const m = await this.store.read(id);
    const consent = validateConsent(body as unknown as ConsentInput, m.performer);
    const gold = m.gold as { version: string; segments: GoldSegment[] } | undefined;
    if (!gold?.segments?.length) throw new VocalFixError('Forge the Gold Vocal first.', 409);
    const client = this.replicate();
    const epochs =
      typeof body.epochs === 'number' &&
      Number.isInteger(body.epochs) &&
      body.epochs >= 5 &&
      body.epochs <= 100
        ? body.epochs
        : 10;
    const at = this.now().toISOString();
    const voice: VoiceModel = {
      id: VoiceRegistry.newId(),
      performer: m.performer,
      status: 'training',
      created_at: at,
      consent: {
        own_voice: true,
        attested_name: consent.attested_name,
        statement: consent.statement,
        attested_at: at,
        session_id: id
      },
      provider: 'replicate',
      model_url: null,
      profile: m.profile
    };
    await this.store.update(id, (cur) => {
      cur.voices.push(voice.id);
      cur.audit.push({
        at,
        event: 'voice_consent',
        detail: {
          voice_id: voice.id,
          attested_name: consent.attested_name,
          statement: consent.statement,
          own_voice: true
        }
      });
    });
    await this.registry.write(voice);
    const stages = [
      { id: 'dataset', label: 'Bind dataset' },
      { id: 'upload', label: 'Send to the forge' },
      { id: 'train', label: 'Train RVC voice' },
      { id: 'seal', label: 'Seal in registry' }
    ];
    const job = await this.jobs.start(
      this.store.sessionDir(id),
      id,
      'forge',
      stages,
      async (ctx) => {
        try {
          await ctx.stage('dataset', 'active');
          const entries: { name: string; data: Uint8Array }[] = [];
          for (const [i, s] of gold.segments.entries()) {
            const tmp = this.store.filePath(id, 'derived', 'dataset-tmp-' + i + '.wav');
            await ffmpeg(
              [
                '-i',
                this.store.filePath(id, 'derived', s.source_file),
                '-ss',
                String(s.source_start),
                '-to',
                String(s.source_end),
                '-ac',
                '1',
                '-ar',
                '48000',
                '-c:a',
                'pcm_s16le',
                tmp
              ],
              ctx.signal
            );
            entries.push({ name: datasetEntryName(i), data: new Uint8Array(await readFile(tmp)) });
            await rm(tmp, { force: true });
          }
          const zip = buildZip(entries);
          const zipName = await this.uniqueName(id, voice.id, 'dataset', '.zip');
          await this.saveDerived(id, zipName, zip, {
            id: zipName,
            kind: 'dataset',
            source_ids: [gold.version],
            params: { segments: entries.length, voice_id: voice.id },
            provenance: [{ step: 'dataset', tool: 'vocal-fix' }]
          });
          await ctx.stage('dataset', 'done');
          await ctx.stage('upload', 'active');
          const url = await client.uploadFile(zip, 'dataset.zip', 'application/zip', ctx.signal);
          await ctx.stage('upload', 'done');
          await ctx.stage('train', 'active', 'Training on Replicate (several minutes)');
          const created = await client.create(
            MODELS.rvc.version,
            {
              dataset_zip: url,
              epoch: epochs,
              version: 'v2',
              f0method: 'rmvpe_gpu',
              sample_rate: '48k',
              batch_size: '7'
            },
            ctx.signal
          );
          const done = await client.wait(created, {
            signal: ctx.signal,
            intervalMs: this.pollMs * 5,
            timeoutMs: 40 * 60_000
          });
          const modelUrl = outputUrl(done.output);
          if (!modelUrl) throw new VocalFixError('RVC training returned no model.', 502);
          await ctx.stage('train', 'done');
          await ctx.stage('seal', 'active');
          const model = await client.download(modelUrl, 500 * 1024 * 1024, ctx.signal);
          const modelPath = this.registry.path(voice.id).replace(/\.json$/, '.model.zip');
          await writeFile(modelPath, model);
          await this.registry.write({
            ...voice,
            status: 'ready',
            model_url: modelUrl,
            model_file: voice.id + '.model.zip'
          });
          await ctx.stage('seal', 'done');
          return {
            voice_id: voice.id,
            prediction_id: done.id,
            model_file: modelPath,
            model_bytes: model.byteLength
          };
        } catch (error) {
          const msg = ctx.signal.aborted
            ? 'Cancelled by user.'
            : error instanceof Error
              ? error.message
              : String(error);
          await this.registry
            .write({ ...voice, status: 'failed', error: msg })
            .catch(() => undefined);
          throw error;
        }
      }
    );
    return { job, voice };
  }

  private async revokeVoiceFiles(voiceId: string): Promise<void> {
    const path = this.registry.path(voiceId);
    await rm(path, { force: true });
    await rm(path.replace(/\.json$/, '.model.zip'), { force: true });
  }

  async revokeVoice(voiceId: string): Promise<void> {
    const voice = await this.registry.read(voiceId);
    await this.revokeVoiceFiles(voiceId);
    const sid = voice.consent.session_id;
    if (await this.store.exists(sid))
      await this.store.update(sid, (m) => {
        m.voices = m.voices.filter((v) => v !== voiceId);
        m.audit.push({
          at: this.now().toISOString(),
          event: 'voice_revoked',
          detail: { voice_id: voiceId }
        });
      });
  }
}
