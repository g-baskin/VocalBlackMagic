---
type: entity
title: "ModelPicker.svelte"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/client/ModelPicker.svelte"
language: svelte
depends_on: []
used_by:
  - "[[entities/route-ttb-page]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - entity
  - module
  - ttb-studio
  - client
  - svelte-component
related: []
sources:
  - "apps/ttb-studio/src/lib/client/ModelPicker.svelte"
---

# ModelPicker.svelte

## Overview

Grouped model/engine chooser with a bindable value (`apps/ttb-studio/src/lib/client/ModelPicker.svelte:1-40`).

## Signature / Definition

```ts
export interface PickerItem { value; name; group: "open" | "hosted"; runner: string | null; license; commercial; detail; reason: string | null; disabled }
props: { items: PickerItem[]; value: string (bindable) }
```

## Behavior

- Splits items into `Open models (self-hostable)` and `Hosted` (`apps/ttb-studio/src/lib/client/ModelPicker.svelte:21-28`); maps runner ids to display names (`apps/ttb-studio/src/lib/client/ModelPicker.svelte:29-36`).
- Used at `apps/ttb-studio/src/routes/+page.svelte:432`.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/route-ttb-page]]
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/client/ModelPicker.svelte`
