---
type: entity
title: "music/capabilities.ts (legacy capability builder)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/capabilities.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
used_by:
  - "[[entities/route-ttb-get-capabilities]]"
  - "[[entities/test-music]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-music]]"
tags:
  - entity
  - module
  - ttb-studio
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/premium-studio]]"
  - "[[entities/contract-generation-engines]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/capabilities.ts"
---

# music/capabilities.ts (legacy capability builder)

> [!contradiction]
> Contract changed between `29c84e4` and `f88cc09` (HEAD `b58d457`).
> Prior contract: `generation_ready = allowed && (fal || lyria)`.
> New contract: adds optional `replicateConfigured` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:7`, `apps/ttb-studio/src/lib/server/music/capabilities.ts:35-37`).

## Overview

Builds the legacy `TTBCapabilities` report (`apps/ttb-studio/src/lib/server/music/capabilities.ts:1-39`).

## Signature / Definition

```ts
export interface ProviderConfig { falConfigured; lyriaConfigured; generationAllowed; replicateConfigured? }
export function buildCapabilities(config: ProviderConfig): TTBCapabilities
```

## Behavior

- Hosted engines report `disabled outside development`, `ready`, or `needs FAL_KEY` / `needs GEMINI_API_KEY` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:11-29`); `heartmula` and `external-v2` are always `not-configured` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:30-31`).
- `premium_studio` is `{selectable: true, processing_ready: false}` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:34`).
- `generation_ready` is true when allowed and fal, Gemini or Replicate is configured (`apps/ttb-studio/src/lib/server/music/capabilities.ts:35-37`). Replicate has no engine entry in this list, so `generation_ready` can be true while both listed hosted engines say `needs ...`.
- > [!stale]
  > Prior claim (wiki built at `29c84e4`), no longer true at `f88cc09`: `generation_ready` required fal or Gemini only (old line 34).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/route-ttb-get-capabilities]], [[entities/test-music]]
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/premium-studio]], [[entities/contract-generation-engines]]

## Tested by

- [[entities/test-music]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/music/capabilities.ts`
