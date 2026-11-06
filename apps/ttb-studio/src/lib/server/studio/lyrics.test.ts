import { describe, expect, test } from 'bun:test';
import type { LyricsRequest } from '@vbm/contracts';
import { runLyricistChain } from './lyrics';

const request: LyricsRequest = {
  action: 'write',
  description: 'a song about the sea',
  lyrics: '',
  instruction: '',
  max_chars: 800
};
const reply = 'TITLE: Salt\n\n[Verse]\nThe tide pulls the harbour lights away\nand I follow';

function fake(handler: (url: string) => Response) {
  const urls: string[] = [];
  const fetcher = (async (url: string) => {
    urls.push(url);
    return handler(url);
  }) as unknown as typeof fetch;
  return { fetcher, urls };
}

describe('lyricist chain (mocked)', () => {
  test('Anthropic first', async () => {
    const f = fake(() => Response.json({ content: [{ type: 'text', text: reply }] }));
    const result = await runLyricistChain(
      { anthropic: 'a', openai: 'o', gemini: 'g', replicate: null, fetch: f.fetcher },
      request
    );
    expect(result.title).toBe('Salt');
    expect(result.lyricist).toBe('anthropic/claude-haiku-5-5');
    expect(f.urls).toEqual(['https://api.anthropic.com/v1/messages']);
  });

  test('falls through Anthropic and OpenAI failures to Gemini', async () => {
    const f = fake((url) =>
      url.includes('googleapis')
        ? Response.json({ candidates: [{ content: { parts: [{ text: reply }] } }] })
        : new Response('nope', { status: 500 })
    );
    const result = await runLyricistChain(
      { anthropic: 'a', openai: 'o', gemini: 'g', replicate: null, fetch: f.fetcher },
      request
    );
    expect(result.lyricist).toBe('gemini/gemini-3.5-flash-lite');
    expect(f.urls).toHaveLength(3);
  });

  test('OpenAI shape and no-keys 503', async () => {
    const f = fake(() => Response.json({ choices: [{ message: { content: reply } }] }));
    const result = await runLyricistChain(
      { anthropic: null, openai: 'o', gemini: null, replicate: null, fetch: f.fetcher },
      request
    );
    expect(result.lyricist).toBe('openai/gpt-6-luna');
    const none = await runLyricistChain(
      { anthropic: null, openai: null, gemini: null, replicate: null, fetch: f.fetcher },
      request
    ).catch((e) => e);
    expect(none.status).toBe(503);
  });
});
