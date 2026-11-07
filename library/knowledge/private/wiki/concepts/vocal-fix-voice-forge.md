---
type: concept
title: "Vocal Fix voice forge"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "RVC training"
  - "voice registry"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/gold-vocal]]"
  - "[[concepts/consent-record]]"
sources:
  - "apps/vocal-fix/src/lib/server/service.ts"
  - "apps/vocal-fix/src/lib/server/forge.ts"
---

# Vocal Fix voice forge

## Definition

Training an RVC voice model on Replicate from Gold Vocal segments after an own-voice attestation, then recording it in the shared voice registry.

## How it works

- Consent gate: typed name equals performer, own voice ticked, exact statement (`apps/vocal-fix/src/lib/server/forge.ts:17-31`).
- A `training` voice and a `voice_consent` audit event are written before work starts (`apps/vocal-fix/src/lib/server/service.ts:644-674`).
- The job cuts segments to mono 48 kHz WAV, zips them, uploads, trains, downloads the model to `<id>.model.zip` and marks the voice ready; failures mark it failed (`apps/vocal-fix/src/lib/server/service.ts:686-775`).
- Registry lives at `<data>/shared/voices` and is described as read by TTB Studio (`apps/vocal-fix/src/lib/server/forge.ts:92-97`). Revoke deletes files and audits it (`apps/vocal-fix/src/lib/server/service.ts:786-799`).

## Why it matters

This is identity conditioning; the consent check proves only that typed text matches a self-declared performer name.

## Examples in this codebase

- [[entities/mod-vf-forge]]
- [[entities/route-vf-post-sessions-id-forge]]

## Connections

- **involves entities:** [[entities/mod-vf-forge]], [[entities/mod-vf-service]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-get-voices]], [[entities/route-vf-delete-voices-voice-id]], [[entities/route-vf-page-session-id-forge]], [[entities/route-vf-page-voices]], [[entities/mod-contracts-voice]]
- **related concepts:** [[concepts/gold-vocal]], [[concepts/consent-record]]

## Sources

- `apps/vocal-fix/src/lib/server/service.ts`
- `apps/vocal-fix/src/lib/server/forge.ts`
