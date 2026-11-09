import { ffmpegPath } from '../studio/master';

/** Renders an lavfi source (or a filter graph) to a WAV for tests. */
export async function render(
  file: string,
  lavfi: string,
  extra: string[] = []
): Promise<Uint8Array> {
  const proc = Bun.spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      lavfi,
      ...extra,
      '-c:a',
      'pcm_s16le',
      file
    ],
    { stdout: 'ignore', stderr: 'pipe' }
  );
  if ((await proc.exited) !== 0) throw new Error(await new Response(proc.stderr).text());
  return new Uint8Array(await Bun.file(file).arrayBuffer());
}

/** Quiet sine for `quiet` seconds, then a loud burst (the "hit"), then quiet again. */
export const riser = (quiet: number, total: number) =>
  `sine=f=220:d=${total},volume='if(between(t,${quiet},${quiet + 0.05}),1,0.02)':eval=frame`;
