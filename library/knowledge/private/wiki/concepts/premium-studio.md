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
  - studio
related:
  - "[[concepts/hosted-generation-flow]]"
  - "[[concepts/studio-derived-songs]]"
sources:
  - "packages/contracts/src/index.ts"
  - "docs/GLOSSARY.md"
  - "apps/ttb-studio/src/lib/server/studio/master.ts"
  - "apps/ttb-studio/src/lib/server/studio/derive.ts"
---

# Premium Studio

> [!stale]
> Superseded on 2026-11-06 at HEAD `b58d457`. The prior page (built at `29c84e4`) cited the capability flag at `apps/ttb-studio/src/lib/server/music/capabilities.ts:33`; it is now line 34. The prior "Why it matters" covered only the hosted generation route; the studio server added since then also never forwards the flag. See [[questions/studio-is-studio-master-premium-studio]].

> [!contradiction]
> Prior claim (29c84e4, from `docs/GLOSSARY.md:17`): Premium Studio processing is "planned". New evidence: a local non-destructive finishing step exists as Studio Master (`apps/ttb-studio/src/lib/server/studio/derive.ts:173-204`, `apps/ttb-studio/src/lib/server/studio/master.ts:108-116`), but no code ties it to `premium_studio`, and studio adapters hardcode `premium_studio: false` (`apps/ttb-studio/src/lib/server/studio/create.ts:89`). Whether Studio Master is Premium Studio is unresolved; flagged for human judgment.

## Definition

An independent `premium_studio` toggle for optional finishing on a derived copy; not a sound character or billing entitlement (`docs/GLOSSARY.md:17`).

## How it works

- Part of the request contract (`packages/contracts/src/index.ts:19`) and type-checked by the hosted route (`apps/ttb-studio/src/routes/api/generations/+server.ts:36`).
- Capabilities report it selectable but `processing_ready: false` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:34`, `apps/ttb_studio/app.py:59`).
- No provider adapter reads the flag: `buildFalSubmission` and `buildLyriaPrompt` ignore it (`apps/ttb-studio/src/lib/server/music/fal.ts:42-53`, `apps/ttb-studio/src/lib/server/music/lyria.ts:15-23`).
- The studio server sets it to false whenever it builds a legacy request: `apps/ttb-studio/src/lib/server/studio/create.ts:89`, `apps/ttb-studio/src/lib/server/studio/runners/routed.ts:98`, `apps/ttb-studio/src/lib/server/studio/runners/direct.ts:130`.
- Separately, Studio Master makes a new mastered 24-bit WAV child song (two-pass loudnorm to -14 LUFS / -1 dBTP with a gentle tone chain), leaving the parent untouched (`apps/ttb-studio/src/lib/server/studio/derive.ts:173-204`, `apps/ttb-studio/src/lib/server/studio/master.ts:16-23`, `apps/ttb-studio/src/lib/server/studio/master.ts:108-116`).

## Why it matters

At HEAD `b58d457` selecting the flag still changes nothing in generated output. Derived-copy finishing does exist, but only as the explicit Studio Master action.

## Examples in this codebase

- [[entities/contract-generation-request]]
- [[entities/mod-music-capabilities]]
- [[entities/mod-studio-master]]
- [[entities/mod-studio-derive]]

## Connections

- **involves entities:** [[entities/contract-generation-request]], [[entities/mod-music-capabilities]], [[entities/route-ttb-post-generations]], [[entities/ep-ttb-get-capabilities]], [[entities/mod-studio-master]], [[entities/mod-studio-derive]], [[entities/mod-studio-create]], [[entities/route-ttb-post-studio-songs-id-master]]
- **related concepts:** [[concepts/hosted-generation-flow]], [[concepts/studio-derived-songs]]

## Sources

- `packages/contracts/src/index.ts`
- `docs/GLOSSARY.md`
- `apps/ttb-studio/src/lib/server/studio/master.ts`
- `apps/ttb-studio/src/lib/server/studio/derive.ts`
