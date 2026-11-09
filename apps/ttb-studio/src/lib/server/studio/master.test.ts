import { describe, expect, test } from 'bun:test';
import { masteringPresets, type MasteringPreset } from '../../mastering';
import { masterArgs, masterPresetRequest, measureArgs, type Loudness } from './master';

const measured: Loudness = {
  input_i: '-24',
  input_tp: '-12',
  input_lra: '4',
  input_thresh: '-34',
  target_offset: '0'
};
const filter = (args: string[]) => args[args.indexOf('-af') + 1];

describe('whole-mix mastering presets', () => {
  test('legacy empty object selects Balanced; all eight named choices validate', () => {
    expect(masteringPresets).toHaveLength(8);
    expect(masterPresetRequest({})).toBe('balanced');
    for (const { id } of masteringPresets) expect(masterPresetRequest({ preset: id })).toBe(id);
  });
  test('rejects malformed bodies and unknown options before processing', () => {
    for (const body of [
      undefined,
      null,
      [],
      'warm',
      1,
      { preset: null },
      { preset: [] },
      { preset: 'unknown' },
      { preset: '__proto__' },
      { preset: 'Warm' },
      { filter: 'custom' },
      { preset: 'warm', output: 'elsewhere' }
    ]) {
      expect(() => masterPresetRequest(body)).toThrow();
    }
  });
  test('Balanced keeps the existing two-pass tone chain unchanged', () => {
    expect(filter(measureArgs('/input.wav'))).toBe(
      'highpass=f=28,equalizer=f=280:t=q:w=1.1:g=-1.5,equalizer=f=3500:t=q:w=1.4:g=0.8,' +
        'highshelf=f=11000:g=1.2,acompressor=threshold=-18dB:ratio=2:attack=25:release=250:makeup=1.5,' +
        'loudnorm=I=-14:TP=-1:LRA=11:print_format=json'
    );
    expect(masterArgs('/i', '/o', measured)).toEqual(masterArgs('/i', '/o', measured, 'balanced'));
  });
  test('new finishes use the advertised tone shaping; Dynamic adds no compressor', () => {
    expect(filter(measureArgs('/i', 'deep-bass'))).toContain('equalizer=f=65:t=q:w=0.8:g=2');
    expect(filter(measureArgs('/i', 'smooth'))).toContain('equalizer=f=3500:t=q:w=1:g=-1.8');
    expect(filter(measureArgs('/i', 'presence'))).toContain('equalizer=f=2400:t=q:w=0.9:g=1.3');
    expect(filter(measureArgs('/i', 'dynamic'))).toBe(
      'highpass=f=20,loudnorm=I=-14:TP=-1:LRA=11:print_format=json'
    );
    expect(filter(masterArgs('/i', '/o', measured, 'dynamic'))).not.toContain('acompressor');
  });
  test('presets have distinct chains, identical measurement/render processing and fixed targets', () => {
    const chains = new Set<string>();
    for (const { id } of masteringPresets) {
      const measure = filter(measureArgs('/input file.wav', id));
      const render = filter(masterArgs('/input file.wav', '/new copy.wav', measured, id));
      const chain = measure.split(',loudnorm=')[0];
      chains.add(chain);
      expect(render.split(',loudnorm=')[0]).toBe(chain);
      expect(render).toContain('loudnorm=I=-14:TP=-1:LRA=11:measured_I=-24');
      expect(masterArgs('/input file.wav', '/new copy.wav', measured, id).at(-1)).toBe(
        '/new copy.wav'
      );
    }
    expect(chains.size).toBe(masteringPresets.length);
    expect(() => measureArgs('/i', 'unknown' as MasteringPreset)).toThrow();
  });
});
