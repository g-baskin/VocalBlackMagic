import { describe, expect, test } from 'bun:test';
import {
  defaultModMatrix,
  modDestinations,
  modSources,
  newKit,
  padNoteName,
  validateKit,
  validateSfxRequest,
  validateSliceRequest
} from './index';

const id = '11111111-2222-4333-8444-555555555555';
const kit = () => newKit(id, 'Orca Breach', '2026-11-08T00:00:00.000Z');

describe('kits', () => {
  test('a new kit is valid and spans C1 to B3', () => {
    const k = kit();
    expect(validateKit(k)).toBeNull();
    expect(k.pads).toHaveLength(36);
    expect(padNoteName(k.pads[0].note)).toBe('C1');
    expect(padNoteName(k.pads[35].note)).toBe('B3');
    expect(padNoteName(61)).toBe('C#3');
    // New pads play the moment they are pressed.
    expect(k.pads.every((p) => p.launch.lands_on === 'natural')).toBe(true);
  });

  test('unknown schema versions are refused, not guessed', () => {
    expect(validateKit({ ...kit(), schema: 2 })).toMatch(/schema/);
  });

  test('out-of-range values are refused rather than clamped', () => {
    const k = kit();
    k.whole.cutoff_hz = 30000;
    expect(validateKit(k)).toMatch(/whole.cutoff_hz/);
    const m = kit();
    m.macros[3] = 1.5;
    expect(validateKit(m)).toMatch(/Macros/);
    const l = kit();
    l.layers[1].grain.size_ms = 0;
    expect(validateKit(l)).toMatch(/layer 2 grain.size_ms/);
    const f = kit();
    f.fx.delay_feedback = 1;
    expect(validateKit(f)).toMatch(/delay_feedback/);
  });

  test('pads hold sound ids or null and valid launch settings', () => {
    const k = kit();
    k.pads[0].layers[0] = '../../etc/passwd';
    expect(validateKit(k)).toMatch(/layers/);
    const n = kit();
    n.pads[4].note = 99;
    expect(validateKit(n)).toMatch(/wrong note/);
    const g = kit();
    (g.pads[0].launch as { lands_on: string }).lands_on = '3 bars';
    expect(validateKit(g)).toMatch(/launch/);
  });

  test('the default mod matrix maps macros 1–8 and every row is a known route', () => {
    const rows = defaultModMatrix();
    expect(rows).toHaveLength(16);
    expect(rows[0]).toEqual({ source: 'macro1', destination: 'all_cutoff', amount: -0.6 });
    for (const r of rows) {
      expect(modSources).toContain(r.source);
      expect(modDestinations).toContain(r.destination);
    }
    const k = kit();
    k.mod[9] = { source: 'macro9', destination: 'none', amount: 0 };
    expect(validateKit(k)).toMatch(/mod matrix/);
  });
});

describe('slice and sound requests', () => {
  const slice = {
    from: 'song',
    song_id: id,
    stem: 'drums',
    mode: 'manual',
    start_seconds: 1,
    end_seconds: 2.5,
    name: 'Hit',
    category: 'drum'
  };
  test('valid slices pass; bad ranges and sources are refused', () => {
    expect(validateSliceRequest(slice)).toBeNull();
    expect(validateSliceRequest({ ...slice, end_seconds: 1.01 })).toMatch(/at least/);
    expect(validateSliceRequest({ ...slice, end_seconds: 40 })).toMatch(/at most 30/);
    expect(validateSliceRequest({ ...slice, mode: 'auto', end_seconds: 40 })).toBeNull();
    expect(validateSliceRequest({ ...slice, stem: 'kazoo' })).toMatch(/stem/);
    expect(validateSliceRequest({ ...slice, song_id: '../x' })).toMatch(/song/);
    expect(validateSliceRequest({ ...slice, from: 'web' })).toMatch(/from/);
    expect(validateSliceRequest({ ...slice, category: 'noise' })).toMatch(/category/);
    expect(validateSliceRequest({ ...slice, from: 'gold', voice_id: 'voice-x' })).toBeNull();
  });

  const sfx = {
    prompt: 'deep cinematic impact',
    duration_seconds: 2,
    loop: false,
    prompt_influence: 0.3,
    model: 'eleven_text_to_sound_v2',
    name: 'Boom',
    category: 'impact'
  };
  test('sound generation requests follow the provider limits', () => {
    expect(validateSfxRequest(sfx)).toBeNull();
    expect(validateSfxRequest({ ...sfx, duration_seconds: null })).toBeNull();
    expect(validateSfxRequest({ ...sfx, duration_seconds: 0.2 })).toMatch(/0.5 to 30/);
    expect(validateSfxRequest({ ...sfx, duration_seconds: 31 })).toMatch(/0.5 to 30/);
    expect(validateSfxRequest({ ...sfx, prompt_influence: 2 })).toMatch(/influence/);
    expect(validateSfxRequest({ ...sfx, model: 'eleven_v9' })).toMatch(/model/);
    expect(validateSfxRequest({ ...sfx, prompt: 'x' })).toMatch(/Describe/);
  });
});
