export type MidiEvent =
  | { type: 'on'; note: number; velocity: number }
  | { type: 'off'; note: number }
  | { type: 'cc'; controller: number; value: number };

/** Note on/off and control change on any channel; everything else is ignored. */
export function parseMidi(data: ArrayLike<number>): MidiEvent | null {
  if (data.length < 3) return null;
  const kind = data[0] & 0xf0;
  const a = data[1] & 0x7f;
  const b = data[2] & 0x7f;
  if (kind === 0x90) return b > 0 ? { type: 'on', note: a, velocity: b } : { type: 'off', note: a };
  if (kind === 0x80) return { type: 'off', note: a };
  if (kind === 0xb0) return { type: 'cc', controller: a, value: b };
  return null;
}

/** CC 21–28 (Akai, Novation) and CC 70–77 (Arturia, MPK knobs) drive macros 1–8. */
export function macroForCc(controller: number): number | null {
  if (controller >= 21 && controller <= 28) return controller - 21;
  if (controller >= 70 && controller <= 77) return controller - 70;
  return null;
}

export interface MidiConnection {
  inputs: () => string[];
  stop: () => void;
}

/** Listens to every MIDI input, including ones plugged in later. Throws a plain message on failure. */
export async function connectMidi(
  onEvent: (event: MidiEvent) => void,
  onChange: () => void = () => {}
): Promise<MidiConnection> {
  if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator))
    throw new Error(
      'This browser has no Web MIDI. Use Chrome, Edge or Firefox; Safari does not support it.'
    );
  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch {
    throw new Error('MIDI permission was refused. Allow MIDI for this site and try again.');
  }
  const handler = (e: MIDIMessageEvent) => {
    const event = e.data ? parseMidi(e.data) : null;
    if (event) onEvent(event);
  };
  const attach = () => {
    for (const input of access.inputs.values()) input.onmidimessage = handler;
    onChange();
  };
  attach();
  access.onstatechange = attach;
  return {
    inputs: () => [...access.inputs.values()].map((i) => i.name ?? 'MIDI input'),
    stop: () => {
      access.onstatechange = null;
      for (const input of access.inputs.values()) input.onmidimessage = null;
    }
  };
}
