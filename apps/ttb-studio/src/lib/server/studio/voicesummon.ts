import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { CreateSongRequest, SongMeta, StemName, VoiceModel } from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { fitLyrics, replicateModels } from './engines';
import { goldVocalFile } from './gold';
import { submitReplicateTasks, type JobContext, type JobTask, type SongPlan } from './jobs';
import type { SongLibrary } from './library';
import { makeInstrumental, makeReference } from './master';
import type { ReplicateDeps } from './replicate';
import { usableVoices } from './voices';

export const voiceSummonCostUsd = 0.035;
const music01MaxLyrics = 380;

/** Runs an ffmpeg step into a scratch MP3 and returns it as an inline data URI. */
async function mp3DataUri(make: (output: string) => Promise<void>): Promise<string> {
  const scratch = await mkdtemp(path.join(tmpdir(), 'vbm-ref-'));
  try {
    const out = path.join(scratch, 'ref.mp3');
    await make(out);
    return 'data:audio/mpeg;base64,' + Buffer.from(await readFile(out)).toString('base64');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

/** Instrumental reference: the non-vocal stems of the song (or a stems child), else the song itself. */
export async function instrumentalSources(
  library: SongLibrary,
  songId: string
): Promise<{ files: string[]; from: string }> {
  const song = await library.get(songId);
  const withStems = song.stems?.length
    ? song
    : (await library.list()).find(
        (s) => s.parent_id === song.id && s.kind === 'stems' && s.stems?.length
      );
  // Uploaded stems may lack some buses; use the non-vocal ones present (generated stems have all three).
  const names: StemName[] = (['drums', 'bass', 'other'] as const).filter((name) =>
    withStems?.stems?.some((stem) => stem.name === name)
  );
  if (withStems && names.length) {
    const files: string[] = [];
    for (const name of names) files.push((await library.audioFile(withStems.id, name)).file);
    return { files, from: 'stems of ' + withStems.id };
  }
  return {
    files: [(await library.audioFile(song.id, 'main')).file],
    from: 'full mix of ' + song.id
  };
}

export function music01Lyrics(lyrics: string): string {
  const plain = lyrics
    .split('\n')
    .filter((line) => !/^\s*\[[^\]]*\]\s*$/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return fitLyrics(plain, music01MaxLyrics);
}

export async function findVoice(root: string, id: string): Promise<VoiceModel> {
  const voice = (await usableVoices(root)).find((v) => v.id === id);
  if (!voice)
    throw new ProviderError(
      422,
      'Choose a ready voice with own-voice consent from Voice training.'
    );
  return voice;
}

/** Submits MiniMax Music-01 takes with the voice's Gold Vocal and an instrumental reference. */
export async function submitVoiceSummon(
  ctx: JobContext,
  deps: ReplicateDeps,
  request: CreateSongRequest,
  voice: VoiceModel,
  lyrics: string,
  plan: SongPlan
): Promise<{ tasks: JobTask[]; plan: SongPlan }> {
  const sung = music01Lyrics(lyrics);
  if (sung.length < 10) throw new ProviderError(422, 'Singing in your voice needs some lyrics.');
  const gold = await goldVocalFile(ctx.library.root, voice);
  const instrumental = await instrumentalSources(ctx.library, request.reference_song_id ?? '');
  const voiceRef = await mp3DataUri((out) => makeReference(gold, out));
  const musicRef = await mp3DataUri((out) =>
    instrumental.files.length === 1
      ? makeReference(instrumental.files[0], out)
      : makeInstrumental(instrumental.files, out)
  );
  const input = {
    lyrics: sung,
    voice_file: voiceRef,
    instrumental_file: musicRef,
    sample_rate: 44100,
    bitrate: 256000
  };
  const tasks = await submitReplicateTasks(
    deps,
    replicateModels.reimagine,
    Array.from({ length: request.takes }, () => input)
  );
  const voiceMeta: SongMeta['voice'] = {
    voice_id: voice.id,
    performer: voice.performer,
    consent_ref: voice.consent.session_id,
    attested_at: voice.consent.attested_at
  };
  return {
    tasks,
    plan: {
      ...plan,
      lyrics: sung,
      engine: 'minimax/music-01 (voice reference)',
      parent_id: request.reference_song_id ?? null,
      params: { ...plan.params, voice_id: voice.id, instrumental_reference: instrumental.from },
      est_cost_usd: voiceSummonCostUsd + (plan.params.lyrics_written_by_ai ? 0.005 : 0),
      voice: voiceMeta
    }
  };
}
