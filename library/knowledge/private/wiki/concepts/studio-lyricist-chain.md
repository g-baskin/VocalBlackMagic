---
type: concept
title: "Studio lyricist chain"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "lyrics writer"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - studio
related:
  - "[[concepts/studio-job-lifecycle]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/lyrics.ts"
---

# Studio lyricist chain

## Definition

Lyrics for vocal songs without user lyrics are written by Anthropic, OpenAI, Gemini, then Replicate Claude, stopping at the first usable answer.

## How it works

- Chain order and failure handling (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:230-270`).
- Prompt injection fencing (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:7-39`); truncation is a failure (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:193-209`).
- Called from `createSongs` when lyrics are needed (`apps/ttb-studio/src/lib/server/studio/create.ts:129-151`).

## Why it matters

Lyrics cost fractions of a cent, so falling through providers is cheap, and cut-off songs are never accepted.

## Examples in this codebase

- [[entities/mod-studio-lyrics]]

## Connections

- **involves entities:** [[entities/mod-studio-lyrics]], [[entities/mod-studio-create]], [[entities/route-ttb-post-studio-lyrics]]
- **related concepts:** [[concepts/studio-job-lifecycle]]

## Sources

- `apps/ttb-studio/src/lib/server/studio/lyrics.ts`
