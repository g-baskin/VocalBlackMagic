---
type: entity
title: "Vocal Fix page /"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/routes/+page.svelte"
language: ts
depends_on:
  - "[[entities/mod-contracts]]"
  - "[[entities/contract-vocal-reference-session]]"
  - "[[entities/ui-brand-header]]"
  - "[[entities/ui-status-panel]]"
  - "[[entities/route-vf-get-capabilities]]"
  - "[[entities/route-vf-post-references]]"
  - "[[entities/route-vf-delete-reference]]"
  - "[[entities/env-vite-ttb-studio-url]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
route_method: PAGE
route_path: "/"
tags:
  - entity
  - function
  - vocal-fix
  - page
  - sveltekit-route
related:
  - "[[concepts/reference-session]]"
  - "[[concepts/consent-record]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal-fix/src/routes/+page.svelte"
---

# Vocal Fix page /

## Overview

Reference-upload page for Vocal Fix (`apps/vocal-fix/src/routes/+page.svelte:1-193`).

## Signature / Definition

```ts
<script lang="ts"> ... </script> (Svelte 5 runes)
```

## Behavior

- On mount fetches `/api/capabilities` and explains that only upload exists while `gold_vocal` is `not-implemented` (`apps/vocal-fix/src/routes/+page.svelte:17-30`).
- `upload` requires the rights checkbox, five files and a performer name, then POSTs a form with `voice_owner` and `acknowledged_rights=true` (`apps/vocal-fix/src/routes/+page.svelte:49-68`).
- Deletes the session with `DELETE /api/references/<id>` (`apps/vocal-fix/src/routes/+page.svelte:81-88`). The TTB Studio link uses `VITE_TTB_STUDIO_URL` (`apps/vocal-fix/src/routes/+page.svelte:15`).

## Connections

- **depends_on:** [[entities/mod-contracts]], [[entities/contract-vocal-reference-session]], [[entities/ui-brand-header]], [[entities/ui-status-panel]], [[entities/route-vf-get-capabilities]], [[entities/route-vf-post-references]], [[entities/route-vf-delete-reference]], [[entities/env-vite-ttb-studio-url]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/reference-session]], [[concepts/consent-record]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/routes/+page.svelte`
