import { expect, test } from 'bun:test';
import fixtures from '../fixtures/engine-requests.json';
import { validateEngineJobRequest } from './engine';

type Case = {
  name: string;
  body: unknown;
  pad?: Record<string, [string, number]>;
  expected: string | null;
};

for (const c of (fixtures as { cases: Case[] }).cases) {
  test(`engine request: ${c.name}`, () => {
    let body = c.body;
    if (c.pad) {
      body = { ...(body as object) };
      for (const [key, [ch, n]] of Object.entries(c.pad))
        (body as Record<string, unknown>)[key] = ch.repeat(n);
    }
    expect(validateEngineJobRequest(body)).toBe(c.expected);
  });
}
