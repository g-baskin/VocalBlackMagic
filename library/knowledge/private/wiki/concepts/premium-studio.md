---
type: concept
title: "Premium Studio"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "premium_studio"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "packages/contracts/src/index.ts"
  - "docs/GLOSSARY.md"
---

# Premium Studio

## Definition

An independent `premium_studio` toggle for optional finishing on a derived copy; not a sound character or billing entitlement (`docs/GLOSSARY.md:17`).

## How it works

- Part of the request contract (`packages/contracts/src/index.ts:19`) and type-checked by the route (`apps/ttb-studio/src/routes/api/generations/+server.ts:36`).
- Capabilities report it selectable but `processing_ready: false` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:33`, `apps/ttb_studio/app.py:59`).
- No provider adapter reads the flag; `buildFalSubmission` and `buildLyriaPrompt` ignore it (`apps/ttb-studio/src/lib/server/music/fal.ts:42-52`, `apps/ttb-studio/src/lib/server/music/lyria.ts:15-23`).

## Why it matters

Selecting it changes nothing in generated output at 29c84e47.

## Examples in this codebase

- [[entities/contract-generation-request]]
- [[entities/mod-music-capabilities]]

## Connections

- **involves entities:** [[entities/contract-generation-request]], [[entities/mod-music-capabilities]], [[entities/route-ttb-post-generations]], [[entities/ep-ttb-get-capabilities]]
- **related concepts:** [[concepts/hosted-generation-flow]]

## Sources

- `packages/contracts/src/index.ts`
- `docs/GLOSSARY.md`
