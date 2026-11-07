---
type: entity
title: "studio/lyrics.ts (lyricist prompt and provider chain)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/mod-music-lyricist]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-replicate]]"
  - "[[entities/ext-api-anthropic-com]]"
  - "[[entities/ext-api-openai-com]]"
  - "[[entities/ext-generativelanguage-googleapis-com]]"
used_by:
  - "[[entities/mod-studio-create]]"
  - "[[entities/route-ttb-post-studio-lyrics]]"
  - "[[entities/test-studio-lyrics]]"
  - "[[entities/test-studio-studio]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-lyrics]]"
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-lyricist-chain]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
---

# studio/lyrics.ts (lyricist prompt and provider chain)

## Overview

Writes, rewrites or extends lyrics with a direct provider chain (Anthropic, OpenAI, Gemini) and a Replicate Claude fallback.

## Signature / Definition

```ts
export const lyricistSystem: string
export function buildLyricsPrompt(request: LyricsRequest): string
export function parseLyricsOutput(raw: string, maxChars: number): { title: string | null; lyrics: string }
export async function runLyricist(deps: ReplicateDeps, request, sleep?)
export interface LyricistChain { anthropic; openai; gemini; replicate; fetch }
export const lyricistModels = { anthropic: 'claude-haiku-5-5', openai: 'gpt-6-luna', gemini: 'gemini-3.5-flash-lite' }
export const lyricistOutputTokens = 4096
export function hitTokenLimit(name, data): boolean
export function directText(name, data): string
export async function runLyricistChain(chain, request): Promise<{ title; lyrics; lyricist }>
```

## Behavior

- The system prompt treats tagged user text as material, never instructions, and forbids naming or imitating real artists (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:7-17`); user text has angle brackets stripped and is fenced in tags (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:19-39`).
- `parseLyricsOutput` removes code fences, extracts a `TITLE:` line, cuts to `maxChars` at a line boundary, drops trailing empty section tags and requires at least 3 real words (502 otherwise) (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:41-68`).
- `runLyricist` tries the Replicate lyricist then its fallback, each with a 60 s wait and up to 30 polls (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:71-102`).
- Direct calls: Anthropic messages with `x-api-key`, OpenAI chat completions with `reasoning_effort: low`, Gemini `generateContent` with `thinkingLevel: MINIMAL` (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:130-187`).
- A provider stop at its token limit is a 502 so the chain falls back rather than returning cut-off lyrics (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:193-209`).
- `runLyricistChain` tries configured direct providers in order with a 60 s timeout, records `provider/model` as `lyricist`, then Replicate; with nothing configured it is a 503 (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:230-270`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-music-errors]], [[entities/mod-music-lyricist]], [[entities/mod-studio-engines]], [[entities/mod-studio-replicate]], [[entities/ext-api-anthropic-com]], [[entities/ext-api-openai-com]], [[entities/ext-generativelanguage-googleapis-com]]
- **used_by:** [[entities/mod-studio-create]], [[entities/route-ttb-post-studio-lyrics]], [[entities/test-studio-lyrics]], [[entities/test-studio-studio]]
- **related:** [[concepts/studio-lyricist-chain]]

## Tested by

- [[entities/test-studio-lyrics]]
- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/lyrics.ts`
