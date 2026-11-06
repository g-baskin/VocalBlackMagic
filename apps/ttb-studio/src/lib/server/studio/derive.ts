import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isSafeModelFile, type SongMeta, type StudioJob, type VoiceModel } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { derivedCosts, fitLyrics, replicateModels } from './engines';
import {
  assertJobCapacity,
  publicJob,
  recordJob,
  submitReplicateTasks,
  type JobContext
} from './jobs';
import { inheritCover } from './cover';
import { makeReference, masterFile } from './master';
import { uploadFile, type ReplicateDeps } from './replicate';
import { isUsableVoice } from './voices';

function needReplicate(ctx: JobContext): ReplicateDeps {
  if (!ctx.replicate)
    throw new ProviderError(503, 'This needs REPLICATE_API_TOKEN in apps/ttb-studio/.env.');
  return ctx.replicate;
}

async function uploadSong(ctx: JobContext, deps: ReplicateDeps, song: SongMeta): Promise<string> {
  const audio = await ctx.library.audioFile(song.id, 'main');
  return uploadFile(deps, Bun.file(audio.file), 'song' + path.extname(audio.file));
}

const base = (parent: SongMeta) => ({
  prompt: parent.prompt,
  style_tags: parent.style_tags,
  parent_id: parent.id
});

export async function startStems(ctx: JobContext, parentId: string): Promise<StudioJob> {
  await assertJobCapacity(ctx);
  const deps = needReplicate(ctx);
  const parent = await ctx.library.get(parentId);
  const url = await uploadSong(ctx, deps, parent);
  const tasks = await submitReplicateTasks(deps, replicateModels.demucs, [
    { audio: url, format: 'wav', shifts: 1 }
  ]);
  const job = await recordJob(
    ctx,
    'stems',
    {
      ...base(parent),
      title: parent.title + ' — stems',
      lyrics: parent.lyrics,
      engine: 'ryan5453/demucs',
      params: { model: 'htdemucs' },
      kind: 'stems',
      est_cost_usd: derivedCosts.stems
    },
    tasks
  );
  return publicJob(job);
}

export async function startReimagine(
  ctx: JobContext,
  parentId: string,
  options: { lyrics: string | null; title: string | null }
): Promise<StudioJob> {
  await assertJobCapacity(ctx);
  const deps = needReplicate(ctx);
  const parent = await ctx.library.get(parentId);
  const lyrics = fitLyrics(
    (options.lyrics?.trim() || parent.lyrics || '')
      .replace(/^\s*\[[^\]]*\]\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    380
  );
  if (lyrics.length < 10)
    throw new ProviderError(422, 'Reimagine needs lyrics: this song has none, so provide some.');
  // MiniMax infers the format from the URL, so send an inline MP3 excerpt rather than an extension-less file URL.
  const source = await ctx.library.audioFile(parent.id, 'main');
  const scratch = await mkdtemp(path.join(tmpdir(), 'vbm-ref-'));
  let url: string;
  try {
    const excerpt = path.join(scratch, 'reference.mp3');
    await makeReference(source.file, excerpt);
    url = 'data:audio/mpeg;base64,' + Buffer.from(await readFile(excerpt)).toString('base64');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
  const tasks = await submitReplicateTasks(deps, replicateModels.reimagine, [
    { song_file: url, lyrics, sample_rate: 44100, bitrate: 256000 }
  ]);
  const job = await recordJob(
    ctx,
    'reimagine',
    {
      ...base(parent),
      title: options.title?.trim() || parent.title + ' (reimagined)',
      lyrics,
      engine: 'minimax/music-01',
      params: { reference_song: parent.id },
      kind: 'reimagine',
      est_cost_usd: derivedCosts.reimagine
    },
    tasks
  );
  return publicJob(job);
}

/** Prefer the local model zip (model_url links expire); upload it and hand Replicate the file URL. */
export async function voiceModelUrl(
  ctx: JobContext,
  deps: ReplicateDeps,
  voice: VoiceModel
): Promise<string> {
  if (voice.model_file !== undefined) {
    if (!isSafeModelFile(voice.model_file) || voice.model_file !== voice.id + '.model.zip')
      throw new ProviderError(422, 'The voice model file name is not valid.');
    const file = path.join(ctx.library.root, 'shared', 'voices', voice.model_file);
    const blob = Bun.file(file);
    if (!(await blob.exists()))
      throw new ProviderError(404, 'The voice model file is missing from the voice registry.');
    return uploadFile(deps, blob, voice.model_file);
  }
  if (voice.model_url) return voice.model_url;
  throw new ProviderError(422, 'That voice has no model to sing with.');
}

export async function startVoice(
  ctx: JobContext,
  parentId: string,
  voice: VoiceModel
): Promise<StudioJob> {
  if (!isUsableVoice(voice))
    throw new ProviderError(422, 'That voice is not ready or lacks own-voice consent.');
  await assertJobCapacity(ctx);
  const deps = needReplicate(ctx);
  const parent = await ctx.library.get(parentId);
  const url = await uploadSong(ctx, deps, parent);
  const modelUrl = await voiceModelUrl(ctx, deps, voice);
  const tasks = await submitReplicateTasks(deps, replicateModels.voice, [
    {
      song_input: url,
      rvc_model: 'CUSTOM',
      custom_rvc_model_download_url: modelUrl,
      output_format: 'wav',
      pitch_change: 'no-change'
    }
  ]);
  const job = await recordJob(
    ctx,
    'voice',
    {
      ...base(parent),
      title: parent.title + ' — sung by ' + voice.performer,
      lyrics: parent.lyrics,
      engine: 'zsxkib/realistic-voice-cloning',
      params: { voice_id: voice.id },
      kind: 'voice',
      est_cost_usd: derivedCosts.voice,
      voice: {
        voice_id: voice.id,
        performer: voice.performer,
        consent_ref: voice.consent.session_id,
        attested_at: voice.consent.attested_at
      }
    },
    tasks
  );
  return publicJob(job);
}

/** Studio Master: a new mastered WAV made locally; the parent song is never modified. */
export async function masterSong(ctx: JobContext, parentId: string): Promise<SongMeta> {
  const parent = await ctx.library.get(parentId);
  const source = await ctx.library.audioFile(parent.id, 'main');
  const { id, dir } = await ctx.library.reserve();
  try {
    const output = path.join(dir, 'audio.wav');
    const master = await masterFile(source.file, output);
    const cover = await inheritCover(ctx.library, parent.id, dir);
    const meta: SongMeta = {
      id,
      title: parent.title + ' — Studio Master',
      prompt: parent.prompt,
      style_tags: parent.style_tags,
      lyrics: parent.lyrics,
      engine: 'ffmpeg studio master',
      params: { target_lufs: -14, true_peak_db: -1 },
      created_at: ctx.now().toISOString(),
      parent_id: parent.id,
      kind: 'master',
      favourite: false,
      audio: { file: 'audio.wav', content_type: 'audio/wav', bytes: Bun.file(output).size },
      master,
      ...(cover ? { cover } : {}),
      est_cost_usd: 0
    };
    await ctx.library.save(meta);
    return meta;
  } catch (error) {
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
}
