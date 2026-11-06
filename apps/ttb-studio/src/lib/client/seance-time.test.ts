import { describe, expect, test } from 'bun:test';
import { cannotCompare, positionIn, takeDuration } from './seance-time';

describe('séance take timing', () => {
  // Regression: every take was labelled and scaled with the LONGEST take's length (2:53 for a 58 s take).
  test('each take reports its own length', () => {
    const buffers = { A: { duration: 58 }, B: { duration: 60 }, C: { duration: 173.8 } };
    expect(takeDuration(buffers, 'A')).toBe(58);
    expect(takeDuration(buffers, 'C')).toBe(173.8);
    expect(takeDuration(buffers, 'D')).toBe(0);
    expect(takeDuration(buffers, null)).toBe(0);
  });
  test('switching takes clamps the position to the new take', () => {
    expect(positionIn(120, 58)).toBe(58);
    expect(positionIn(30, 58)).toBe(30);
    expect(positionIn(-1, 58)).toBe(0);
  });
});

describe('séance that cannot be ranked', () => {
  const take = (status: string, song: boolean) => ({ status, song_id: song ? 'x' : null });
  test('terminal with fewer than two songs offers a reset', () => {
    expect(cannotCompare([take('completed', true), take('failed', false)])).toBe(true);
    expect(cannotCompare([take('failed', false), take('canceled', false)])).toBe(true);
  });
  test('still running, or two songs to rank, does not', () => {
    expect(cannotCompare([take('completed', true), take('running', false)])).toBe(false);
    expect(cannotCompare([take('completed', true), take('completed', true)])).toBe(false);
    expect(cannotCompare([])).toBe(false);
  });
});
