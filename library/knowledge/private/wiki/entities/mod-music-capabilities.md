---
type: entity
title: "music/capabilities.ts (buildCapabilities)"
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
last_commit_hash: "29c84e4"
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

# music/capabilities.ts (buildCapabilities)

## Overview

Builds the `TTBCapabilities` object returned by the SvelteKit capabilities route (`apps/ttb-studio/src/lib/server/music/capabilities.ts:9-36`).

## Signature / Definition

```ts
export interface ProviderConfig { falConfigured; lyriaConfigured; generationAllowed }
export function buildCapabilities(config: ProviderConfig): TTBCapabilities
```

## Behavior

- Hosted engines report `disabled outside development`, `ready`, or `needs FAL_KEY` / `needs GEMINI_API_KEY` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:10-28`).
- `heartmula` and `external-v2` are always `not-configured` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:29-30`).
- `premium_studio` is `{selectable: true, processing_ready: false}` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:33`).
- `generation_ready` is true only when generation is allowed and at least one key is configured (`apps/ttb-studio/src/lib/server/music/capabilities.ts:34`).

## Connections

- **depends_on:** [[entities/mod-contracts]]
- **used_by:** [[entities/route-ttb-get-capabilities]], [[entities/test-music]]
- **related:** [[concepts/dev-only-generation-gate]], [[concepts/premium-studio]], [[entities/contract-generation-engines]]

## Tested by

- [[entities/test-music]]

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `29c84e4` ("Update main with local quality tooling, ADRs and UI restyle from 3997ab2") on 2026-11-05

## Sources

- `apps/ttb-studio/src/lib/server/music/capabilities.ts`
