import type { Kit } from '@vbm/contracts';
import { encodeWav } from '../jobs';
import { KitBus, startPad, tailSeconds, type LoadedSound } from './engine';

const sampleRate = 44100;
const maxSeconds = 600;

/** Dry length of a pad as played naturally (longest layer at the kit pitch). */
export function padSeconds(
  kit: Kit,
  pad: number,
  sounds: ReadonlyMap<string, LoadedSound>
): number {
  const rate = 2 ** (kit.whole.pitch_st / 12);
  let longest = 0;
  for (const id of kit.pads[pad]?.layers ?? []) {
    const s = id ? sounds.get(id) : undefined;
    if (s) longest = Math.max(longest, s.forward.duration / rate);
  }
  return longest;
}

/** Start times for a reel of every playable pad, one after another with a short gap. */
export function reelPlan(
  kit: Kit,
  sounds: ReadonlyMap<string, LoadedSound>,
  gap = 0.25
): { pad: number; at: number }[] {
  const plan: { pad: number; at: number }[] = [];
  let at = 0;
  for (let pad = 0; pad < kit.pads.length; pad++) {
    const seconds = padSeconds(kit, pad, sounds);
    if (seconds <= 0) continue;
    if (at + seconds > maxSeconds) break;
    plan.push({ pad, at });
    at += seconds + gap;
  }
  return plan;
}

async function renderPlan(
  kit: Kit,
  sounds: ReadonlyMap<string, LoadedSound>,
  plan: { pad: number; at: number }[]
): Promise<Blob> {
  // Exports play each pad naturally (no grid wait) through the same chain as live play.
  const seconds = Math.max(...plan.map((p) => p.at + padSeconds(kit, p.pad, sounds)), 0.1);
  const tail = tailSeconds(kit);
  const length = Math.ceil(Math.min(maxSeconds, seconds + tail) * sampleRate);
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const bus = new KitBus(ctx, kit);
  for (const step of plan)
    startPad(ctx, bus, kit, step.pad, sounds, 127, { now: step.at, origin: 0, natural: true });
  return encodeWav(await ctx.startRendering());
}

export function renderPad(kit: Kit, pad: number, sounds: ReadonlyMap<string, LoadedSound>) {
  if (padSeconds(kit, pad, sounds) <= 0) throw new Error('This pad has no loaded sound.');
  return renderPlan(kit, sounds, [{ pad, at: 0 }]);
}

export function renderKitReel(kit: Kit, sounds: ReadonlyMap<string, LoadedSound>) {
  const plan = reelPlan(kit, sounds);
  if (!plan.length) throw new Error('No pad in this kit has a loaded sound.');
  return renderPlan(kit, sounds, plan);
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/[^\w .-]/g, '_') + '.wav';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
