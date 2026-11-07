---
type: entity
title: "queue.fal.run"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/music/fal.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/mod-music-fal]]"
  - "[[entities/mod-studio-edit]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-jobs]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "api"
related:
  - "[[entities/env-fal-key]]"
  - "[[concepts/hosted-generation-flow]]"
sources:
  - "apps/ttb-studio/src/lib/server/music/fal.ts"
  - "apps/ttb-studio/src/lib/server/studio/edit.ts"
---

# queue.fal.run

> [!contradiction]
> Updated in place at HEAD `b58d457`; change introduced in commit `b58d457`.
> Prior claim: only caller is `music/fal.ts`.
> New claim: also called directly by studio edits (`apps/ttb-studio/src/lib/server/studio/edit.ts:269`) and indirectly by studio routing and jobs.

## Overview

fal.ai queue host for ACE-Step 1.5 jobs and ACE-Step v1 edit endpoints (`apps/ttb-studio/src/lib/server/music/fal.ts:5-7`, `apps/ttb-studio/src/lib/server/studio/edit.ts:269`).

## Signature / Definition

```text
https://queue.fal.run
```

## Behavior

- Kind: Real API call target: the server sends requests to this host.
- Caller: submit POST, 15 s (`apps/ttb-studio/src/lib/server/music/fal.ts:79-89`); status GET, 10 s (`apps/ttb-studio/src/lib/server/music/fal.ts:106-113`); result GET, 15 s (`apps/ttb-studio/src/lib/server/music/fal.ts:146-153`)
- Caller: studio edits POST `https://queue.fal.run/<endpoint>`, 60 s (`apps/ttb-studio/src/lib/server/studio/edit.ts:264-274`)
- Caller: studio routing calls `submitFal` (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:3`, `:90`); job polling calls `falStatus`/`falAudioUrl` (`apps/ttb-studio/src/lib/server/studio/jobs.ts:387`, `:392`)
- Caller: media then comes from allow-listed `fal.media` or `storage.googleapis.com/falserverless/` (`apps/ttb-studio/src/lib/server/music/fal.ts:133-143`)

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-music-fal]], [[entities/mod-studio-edit]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-jobs]]
- **related:** [[entities/env-fal-key]], [[concepts/hosted-generation-flow]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `12fb6e8` ("Add hosted song generation to TTB Studio via fal ACE-Step and Google Lyria 3.5 (#2)") on 2026-11-05
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/music/fal.ts`
- `apps/ttb-studio/src/lib/server/studio/edit.ts`

> [!stale]
> The prior version of this page (built at `29c84e4`) said: only caller is `music/fal.ts`.
> See the [!contradiction] callout above for the HEAD state.
