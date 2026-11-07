import { afterEach, describe, expect, test } from 'bun:test';
import { ApiError } from './api';
import { followJob } from './jobs';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const noWait = async () => undefined;

function serve(reply: (call: number) => Response): () => number {
  let calls = 0;
  globalThis.fetch = (async () => reply(++calls)) as unknown as typeof fetch;
  return () => calls;
}

describe('followJob', () => {
  // Regression: a deleted or forbidden job was polled every 4 s forever with no message.
  test('stops on a permanent 4xx and surfaces the server message', async () => {
    const calls = serve(() => Response.json({ detail: 'Job not found.' }, { status: 404 }));
    const error = await followJob(
      'j1',
      () => undefined,
      () => true,
      noWait
    ).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Job not found.');
    expect(calls()).toBe(1);
  });

  test('rides out short outages but gives up after a long one', async () => {
    serve((n) => {
      if (n <= 2) throw new Error('offline');
      if (n === 3) return Response.json({ detail: 'Busy.' }, { status: 503 });
      return Response.json({ job: { id: 'j1', status: 'completed' } });
    });
    const done = await followJob(
      'j1',
      () => undefined,
      () => true,
      noWait
    );
    expect(done?.status).toBe('completed');

    const calls = serve(() => Response.json({ detail: 'Bad gateway.' }, { status: 502 }));
    const error = await followJob(
      'j1',
      () => undefined,
      () => true,
      noWait
    ).catch((e) => e);
    expect(error.message).toBe('Bad gateway.');
    expect(calls()).toBe(8);
  });
});
