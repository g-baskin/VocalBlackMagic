---
type: entity
title: "studio/lyrics.test.ts (bun:test)"
entity_type: test
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/lyrics.test.ts"
language: ts
depends_on:
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-contracts-studio]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - test
  - ttb-studio
  - studio
  - test
related: []
sources:
  - "apps/ttb-studio/src/lib/server/studio/lyrics.test.ts"
---

# studio/lyrics.test.ts (bun:test)

## Overview

Bun test file for the studio server; providers are mocked, never run live.

## Signature / Definition

```ts
bun test apps/ttb-studio/src/lib/server/studio/lyrics.test.ts
```

## Behavior

- mocked lyricist chain: Anthropic first, fall-through to Gemini, OpenAI shape, no-keys 503 (`apps/ttb-studio/src/lib/server/studio/lyrics.test.ts:23-62`).
- token-limit stops fall back; Gemini MAX_TOKENS alone is a 502 (`apps/ttb-studio/src/lib/server/studio/lyrics.test.ts:64-109`).

## Connections

- **depends_on:** [[entities/mod-studio-lyrics]], [[entities/mod-contracts-studio]]
- **used_by:** none found

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/lyrics.test.ts`
