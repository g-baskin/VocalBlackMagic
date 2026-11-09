/** Two keyboard rows as a piano: A W S E D F T G Y H U J K O L P ; (C to E, 17 notes). */
const pianoCodes = [
  'KeyA',
  'KeyW',
  'KeyS',
  'KeyE',
  'KeyD',
  'KeyF',
  'KeyT',
  'KeyG',
  'KeyY',
  'KeyH',
  'KeyU',
  'KeyJ',
  'KeyK',
  'KeyO',
  'KeyL',
  'KeyP',
  'Semicolon'
];
export const maxOctave = 2;

/** Pad index for a key at an octave (0 to 2), or null when it is not a pad key or off the grid. */
export function padForKey(code: string, octave: number): number | null {
  const offset = pianoCodes.indexOf(code);
  if (offset < 0) return null;
  const pad = octave * 12 + offset;
  return pad < 36 ? pad : null;
}

/** Semitones above the keyboard's C for a piano key (0 to 16), or null for other keys. */
export function pianoOffset(code: string): number | null {
  const offset = pianoCodes.indexOf(code);
  return offset < 0 ? null : offset;
}

/** Z and X shift the octave down and up. */
export function octaveShift(code: string): -1 | 1 | 0 {
  return code === 'KeyZ' ? -1 : code === 'KeyX' ? 1 : 0;
}

/** Keys typed into a field or a focused control must not play pads. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const el = target as HTMLElement;
  if (el.isContentEditable) return true;
  return !!el.closest('input, textarea, select, dialog, [contenteditable="true"]');
}

/** Remembers which pad each held key started, so a later octave change releases the right one. */
export class HeldKeys {
  private pads = new Map<string, number>();
  down(code: string, pad: number): void {
    this.pads.set(code, pad);
  }
  /** The pad this key started, or null when the key was not playing one. */
  up(code: string): number | null {
    const pad = this.pads.get(code);
    this.pads.delete(code);
    return pad ?? null;
  }
}

/** Tracks presses so a pad released while its sound is still loading does not start late. */
export class PressTracker {
  private seq = 0;
  private held = new Map<number, number>();
  begin(pad: number): number {
    this.seq += 1;
    this.held.set(pad, this.seq);
    return this.seq;
  }
  end(pad: number): void {
    this.held.delete(pad);
  }
  isHeld(pad: number, token: number): boolean {
    return this.held.get(pad) === token;
  }
}

export function keyLabel(pad: number, octave: number): string | null {
  const offset = pad - octave * 12;
  const code = pianoCodes[offset];
  if (!code) return null;
  return code === 'Semicolon' ? ';' : code.slice(3);
}
