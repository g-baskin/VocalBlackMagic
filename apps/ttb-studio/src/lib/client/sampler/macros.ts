import type { Kit } from '@vbm/contracts';

export interface MacroTargets {
  /** Multiplies the whole-kit cutoff (1 = open). */
  cutoffScale: number;
  /** Bit depth of the lo-fi stage; 16 or more is bypassed. */
  crushBits: number;
  reverbMix: number;
  delayMix: number;
  /** 0 bypassed to 1 heavy saturation. */
  drive: number;
  lowShelfDb: number;
  highShelfDb: number;
  /** Added to every attack. */
  attackMs: number;
}

/** Play-tab macros: Darken, Grain, Space, Echo, Drive, Weight, Air, Swell (0 to 1 each). */
export function macroTargets(m: readonly number[]): MacroTargets {
  const v = (i: number) => Math.min(1, Math.max(0, m[i] ?? 0));
  return {
    cutoffScale: (250 / 20000) ** v(0),
    crushBits: v(1) > 0 ? 16 - v(1) * 12 : 16,
    reverbMix: v(2) * 0.6,
    delayMix: v(3) * 0.5,
    drive: v(4),
    lowShelfDb: v(5) * 12,
    highShelfDb: v(6) * 12,
    attackMs: v(7) * 2000
  };
}

export const dbToGain = (db: number) => 10 ** (db / 20);

/** Velocity sensitivity 0 ignores velocity; 100 maps velocity 1–127 linearly to gain. */
export function velocityGain(velocity: number, sensitivity: number): number {
  const v = Math.min(127, Math.max(1, velocity)) / 127;
  const s = Math.min(100, Math.max(0, sensitivity)) / 100;
  return 1 - s * (1 - v);
}

/** Everything the kit bus needs, combined from the kit and the macros. */
export function busSettings(kit: Kit) {
  const t = macroTargets(kit.macros);
  return {
    cutoffHz: Math.max(20, Math.min(20000, kit.whole.cutoff_hz * t.cutoffScale)),
    reso: kit.whole.reso,
    crushBits: t.crushBits,
    drive: t.drive,
    lowShelfDb: t.lowShelfDb,
    highShelfDb: t.highShelfDb,
    reverbMix: Math.min(1, kit.fx.reverb_mix + t.reverbMix),
    reverbSize: kit.fx.reverb_size,
    delayMix: Math.min(1, kit.fx.delay_mix + t.delayMix),
    delayFeedback: kit.fx.delay_feedback,
    volumeDb: kit.fx.volume_db,
    ceilingDb: kit.fx.ceiling_db
  };
}
