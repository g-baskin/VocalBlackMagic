import { expect, test } from 'bun:test';
import { withAudioRender } from './audio-render';

test('audio editors reject overlapping renders and release the gate on success or failure', async () => {
  let finish!: (value: number) => void;
  const first = withAudioRender(() => new Promise<number>((resolve) => (finish = resolve)));
  let secondRan = false;
  await expect(
    withAudioRender(async () => {
      secondRan = true;
    })
  ).rejects.toThrow('Another audio preview');
  expect(secondRan).toBe(false);
  finish(42);
  expect(await first).toBe(42);
  await expect(
    withAudioRender(async () => {
      throw Error('Synthetic render failure');
    })
  ).rejects.toThrow('Synthetic render failure');
  expect(await withAudioRender(async () => 7)).toBe(7);
});
