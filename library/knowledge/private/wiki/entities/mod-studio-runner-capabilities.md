---
type: entity
title: "studio/runners/capabilities.ts (model capability listing)"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts"
language: ts
depends_on:
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/mod-studio-runner-router]]"
used_by:
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/test-studio-capabilities]]"
  - "[[entities/test-studio-review]]"
last_commit_hash: "b58d457"
tested_by:
  - "[[entities/test-studio-capabilities]]"
  - "[[entities/test-studio-review]]"
tags:
  - entity
  - function
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts"
---

# studio/runners/capabilities.ts (model capability listing)

## Overview

Lists every model with each runner's live status and licence badge.

## Signature / Definition

```ts
export async function modelInfos(keys: RunnerKeys, allowed: boolean): Promise<StudioModelInfo[]>
```

## Behavior

- Outside development every runner reads `disabled outside development`; otherwise `runnerUnavailable` decides, with one engine health read per call (`apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts:7-15`).
- Non-commercial runners show a `Non-commercial` badge (`apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts:21`); `active_runner` is the first ready runner (`apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts:33`).

## Connections

- **depends_on:** [[entities/mod-contracts-studio]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-models]], [[entities/mod-studio-runner-router]]
- **used_by:** [[entities/route-ttb-get-studio-capabilities]], [[entities/test-studio-capabilities]], [[entities/test-studio-review]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-capabilities]]
- [[entities/test-studio-review]]

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/runners/capabilities.ts`
