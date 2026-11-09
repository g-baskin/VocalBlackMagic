import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  maxSlicesPerRequest,
  maxSoundSeconds,
  type SliceRequest,
  type SoundMeta,
  type SoundSource
} from '@vbm/contracts';
import { ProviderError } from '../music/errors';
import { goldVocalFile } from '../studio/gold';
import type { SongLibrary } from '../studio/library';
import { sealedLabel, sealSongs } from '../studio/seal';
import { usableVoices } from '../studio/voices';
import { ffmpeg } from './analyse';
import type { SoundLibrary } from './sounds';

export interface SliceDeps {
  songs: SongLibrary;
  sounds: SoundLibrary;
}

export interface Region {
  start: number;
  end: number;
}

const fixed = (v: number) => v.toFixed(4);

/** Sample-accurate cut (atrim, not input seeking) to a 44.1 kHz stereo WAV. */
export function sliceArgs(input: string, region: Region, output: string): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-i',
    input,
    '-vn',
    '-af',
    'atrim=start=' + fixed(region.start) + ':end=' + fixed(region.end) + ',asetpts=PTS-STARTPTS',
    '-ac',
    '2',
    '-ar',
    '44100',
    '-c:a',
    'pcm_s16le',
    output
  ];
}

export function silenceArgs(input: string, region: Region): string[] {
  return [
    '-hide_banner',
    '-nostdin',
    '-i',
    input,
    '-vn',
    '-af',
    'atrim=start=' +
      fixed(region.start) +
      ':end=' +
      fixed(region.end) +
      ',asetpts=PTS-STARTPTS,silencedetect=noise=-40dB:d=0.08',
    '-f',
    'null',
    '-'
  ];
}

/** Silent spans from silencedetect's stderr, relative to the analysed range. */
export function parseSilences(stderr: string): Region[] {
  const out: Region[] = [];
  let open: number | null = null;
  for (const line of stderr.split('\n')) {
    const start = /silence_start: (-?[\d.]+)/.exec(line);
    if (start) open = Math.max(0, Number(start[1]));
    const end = /silence_end: ([\d.]+)/.exec(line);
    if (end) {
      out.push({ start: open ?? 0, end: Number(end[1]) });
      open = null;
    }
  }
  if (open !== null) out.push({ start: open, end: Infinity });
  return out;
}

/** The sounding parts between silences, capped at 64 slices of at most 30 s each. */
export function regionsBetween(silences: Region[], length: number, offset: number): Region[] {
  const regions: Region[] = [];
  let cursor = 0;
  for (const s of [...silences, { start: length, end: length }]) {
    const start = cursor;
    const end = Math.min(s.start, length);
    cursor = Math.max(cursor, Math.min(s.end, length));
    if (end - start < 0.05) continue;
    regions.push({ start: offset + start, end: offset + Math.min(end, start + maxSoundSeconds) });
    if (regions.length === maxSlicesPerRequest) break;
  }
  return regions;
}

async function resolveInput(
  deps: SliceDeps,
  req: SliceRequest
): Promise<{ file: string; source: (r: Region) => SoundSource }> {
  if (req.from === 'gold') {
    const voice = (await usableVoices(deps.songs.root)).find((v) => v.id === req.voice_id);
    // Only trained voices with an own-voice consent record may be sliced.
    if (!voice)
      throw new ProviderError(
        403,
        'That voice is not ready or has no own-voice consent on record, so its Gold Vocal cannot be sliced.'
      );
    const file = await goldVocalFile(deps.songs.root, voice);
    return {
      file,
      source: (r) => ({
        kind: 'gold',
        voice_id: voice.id,
        performer: voice.performer,
        consent_ref: voice.consent.session_id,
        start_seconds: r.start,
        end_seconds: r.end
      })
    };
  }
  const song = await deps.songs.get(req.song_id as string);
  const [visible] = await sealSongs(deps.songs.root, [song]);
  if (song.seance_id && visible.engine === sealedLabel)
    throw new ProviderError(409, 'Reveal the séance before slicing its takes.');
  const stem = req.stem ?? 'main';
  const { file } = await deps.songs.audioFile(song.id, stem);
  return {
    file,
    source: (r) => ({
      kind: 'slice',
      song_id: song.id,
      song_title: song.title,
      stem,
      start_seconds: r.start,
      end_seconds: r.end,
      license: song.runner?.license ?? null,
      commercial: song.runner?.commercial ?? null
    })
  };
}

/** Cuts one region (manual) or every sounding part of the range (auto) into new sounds. */
export async function sliceSounds(deps: SliceDeps, req: SliceRequest): Promise<SoundMeta[]> {
  const input = await resolveInput(deps, req);
  const range = { start: req.start_seconds, end: req.end_seconds };
  let regions: Region[] = [range];
  if (req.mode === 'auto') {
    const stderr = await ffmpeg(silenceArgs(input.file, range), 'The audio could not be analysed.');
    regions = regionsBetween(parseSilences(stderr), range.end - range.start, range.start);
    if (!regions.length)
      throw new ProviderError(422, 'No sounding parts were found in that range.');
  }
  const tmp = await mkdtemp(path.join(tmpdir(), 'vbm-slice-'));
  const made: SoundMeta[] = [];
  try {
    for (const [i, region] of regions.entries()) {
      const out = path.join(tmp, i + '.wav');
      await ffmpeg(sliceArgs(input.file, region, out), 'The slice could not be cut.');
      const bytes = new Uint8Array(await readFile(out));
      made.push(
        await deps.sounds.add({
          bytes,
          name: regions.length > 1 ? req.name.trim() + ' ' + (i + 1) : req.name,
          category: req.category,
          source: input.source({ start: region.start, end: region.end })
        })
      );
    }
  } catch (error) {
    // A batch is all or nothing so a failed auto-slice does not leave half a set behind.
    for (const sound of made) await deps.sounds.remove(sound.id).catch(() => undefined);
    throw error;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  return made;
}
