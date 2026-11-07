---
type: entity
title: "TTB Studio PAGE /seance"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/routes/seance/+page.svelte"
language: ts
depends_on:
  - "[[entities/mod-ttb-client-seance-time]]"
  - "[[entities/ui-arcane-panel]]"
  - "[[entities/ui-rune-button]]"
  - "[[entities/ui-arcane-input]]"
  - "[[entities/ui-arcane-textarea]]"
  - "[[entities/ui-rune-toggle]]"
  - "[[entities/ui-ritual-progress]]"
  - "[[entities/ui-waveform]]"
  - "[[entities/mod-ui-audio]]"
  - "[[entities/mod-contracts-studio]]"
  - "[[entities/mod-ttb-client-api]]"
  - "[[entities/route-ttb-get-studio-capabilities]]"
  - "[[entities/route-ttb-get-studio-seances-leaderboard]]"
  - "[[entities/route-ttb-post-studio-seances]]"
  - "[[entities/route-ttb-get-studio-seances-id]]"
  - "[[entities/route-ttb-post-studio-seances-id-rank]]"
  - "[[entities/route-ttb-get-studio-songs-id-audio]]"
used_by:
  - "[[entities/route-ttb-layout]]"
last_commit_hash: "b58d457"
tested_by: []
route_method: PAGE
route_path: "/seance"
tags:
  - entity
  - function
  - ttb-studio
  - sveltekit-route
  - page
related:
  - "[[concepts/ttb-seance]]"
  - "[[concepts/ttb-job-polling]]"
sources:
  - "apps/ttb-studio/src/routes/seance/+page.svelte"
---

# TTB Studio PAGE /seance

## Overview

Blind comparison of up to four models on one prompt, ranked then revealed (`apps/ttb-studio/src/routes/seance/+page.svelte:1-275`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- On mount reads capabilities, resumes a `?id=` séance and loads the leaderboard (`apps/ttb-studio/src/routes/seance/+page.svelte:58-71`); at most 4 models can be picked (`apps/ttb-studio/src/routes/seance/+page.svelte:90-96`).
- `summon` validates with `validateSeanceRequest`, POSTs, and writes `?id=` into history (`apps/ttb-studio/src/routes/seance/+page.svelte:98-125`).
- `follow` polls every 4 s and tolerates 3 misses with growing back-off before giving up on the 4th (`apps/ttb-studio/src/routes/seance/+page.svelte:127-150`); finished takes are decoded from `audioUrl` (`apps/ttb-studio/src/routes/seance/+page.svelte:152-160`).
- Each take uses its own duration (`apps/ttb-studio/src/routes/seance/+page.svelte:55`); `reveal` POSTs the order and reloads the board (`apps/ttb-studio/src/routes/seance/+page.svelte:245-262`); `cannotCompare` offers a reset (`apps/ttb-studio/src/routes/seance/+page.svelte:425-431`).

## Connections

- **depends_on:** [[entities/mod-ttb-client-seance-time]], [[entities/ui-arcane-panel]], [[entities/ui-rune-button]], [[entities/ui-arcane-input]], [[entities/ui-arcane-textarea]], [[entities/ui-rune-toggle]], [[entities/ui-ritual-progress]], [[entities/ui-waveform]], [[entities/mod-ui-audio]], [[entities/mod-contracts-studio]], [[entities/mod-ttb-client-api]], [[entities/route-ttb-get-studio-capabilities]], [[entities/route-ttb-get-studio-seances-leaderboard]], [[entities/route-ttb-post-studio-seances]], [[entities/route-ttb-get-studio-seances-id]], [[entities/route-ttb-post-studio-seances-id-rank]], [[entities/route-ttb-get-studio-songs-id-audio]]
- **used_by:** [[entities/route-ttb-layout]]
- **related:** [[concepts/ttb-seance]], [[concepts/ttb-job-polling]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/routes/seance/+page.svelte`
