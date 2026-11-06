---
type: concept
title: "Consent record (rights attestation)"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "acknowledged_rights"
  - "rights attestation"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal_fix/app.py"
  - "apps/vocal-fix/src/routes/api/references/+server.ts"
  - "docs/GLOSSARY.md"
---

# Consent record (rights attestation)

## Definition

The only consent captured today is the uploader's boolean `acknowledged_rights` plus a `voice_owner` name; it is not a verified authorization or audit trail (`docs/GLOSSARY.md:13`).

## How it works

- The page sends `acknowledged_rights=true` only after the checkbox is ticked (`apps/vocal-fix/src/routes/+page.svelte:51`, `apps/vocal-fix/src/routes/+page.svelte:58-59`).
- SvelteKit refuses with 403 unless it equals `true` (`apps/vocal-fix/src/routes/api/references/+server.ts:24-28`); Python refuses likewise (`apps/vocal_fix/app.py:81-84`) and records it in the manifest (`apps/vocal_fix/app.py:124-125`).
- `AudioAssetRecord.ownerConsentId` is a nullable placeholder (`packages/database/src/index.ts:14`).

## Why it matters

A ticked checkbox is not proof of consent; production readiness requires a consent audit trail (see `docs/RIGHTS_AND_SAFETY.md`).

## Examples in this codebase

- [[entities/route-vf-post-references]]
- [[entities/ep-vf-post-references]]

## Connections

- **involves entities:** [[entities/route-vf-post-references]], [[entities/ep-vf-post-references]], [[entities/route-vf-page]], [[entities/mod-database]], [[entities/contract-vocal-reference-session]]
- **related concepts:** [[concepts/reference-session]]

## Sources

- `apps/vocal_fix/app.py`
- `apps/vocal-fix/src/routes/api/references/+server.ts`
- `docs/GLOSSARY.md`
