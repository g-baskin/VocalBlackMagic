---
type: concept
title: "Consent record (rights attestation)"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "acknowledged_rights"
  - "rights attestation"
  - "own-voice consent"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - vocal-fix
related:
  - "[[concepts/reference-session]]"
  - "[[concepts/vocal-fix-voice-forge]]"
sources:
  - "apps/vocal-fix/src/lib/server/service.ts"
  - "apps/vocal-fix/src/lib/server/forge.ts"
  - "docs/GLOSSARY.md"
---

# Consent record (rights attestation)

> [!contradiction]
> Updated at commit `f88cc09` (2026-11-06). Prior: only a boolean plus `voice_owner` sent to Python; no audit trail. Now: manifest consent object and audit events, plus own-voice name match for forge.

## Definition

Self-declared attestations stored with a session: a rights acknowledgement at intake and a typed-name own-voice statement before voice training. Neither is a verified identity or authorization.

## How it works

- Intake refuses with 403 unless `acknowledged_rights === true` and stores the rights statement and time in `consent` and an `intake` audit event (`apps/vocal-fix/src/lib/server/service.ts:114-115`, `apps/vocal-fix/src/lib/server/service.ts:135-173`).
- Forge refuses with 403 unless own voice is ticked and the typed name matches the performer, then audits `voice_consent` and copies consent into the voice record (`apps/vocal-fix/src/lib/server/forge.ts:17-31`, `apps/vocal-fix/src/lib/server/service.ts:645-673`).
- Revocation appends `voice_revoked` (`apps/vocal-fix/src/lib/server/service.ts:791-798`); deleting a session removes its manifest and therefore its audit trail (`apps/vocal-fix/src/lib/server/service.ts:182-189`).

## Why it matters

A ticked box and a matching name are not proof of consent; production readiness requires a verified consent audit trail (`docs/RIGHTS_AND_SAFETY.md`).

## Examples in this codebase

- [[entities/mod-vf-forge]]
- [[entities/route-vf-post-sessions]]

## Prior description (stale)

> [!stale]
> Superseded at commit `f88cc09` (2026-11-06). Reason: intake and forge now record consent in the session.

- Page sent `acknowledged_rights=true` and `voice_owner` to `/api/references`; Python recorded it; `AudioAssetRecord.ownerConsentId` placeholder (`packages/database/src/index.ts:14`).

## Connections

- **involves entities:** [[entities/mod-vf-service]], [[entities/mod-vf-forge]], [[entities/route-vf-post-sessions]], [[entities/route-vf-post-sessions-id-forge]], [[entities/route-vf-page]], [[entities/route-vf-post-references]], [[entities/ep-vf-post-references]], [[entities/mod-database]]
- **related concepts:** [[concepts/reference-session]], [[concepts/vocal-fix-voice-forge]]

## Sources

- `apps/vocal-fix/src/lib/server/service.ts`
- `apps/vocal-fix/src/lib/server/forge.ts`
- `docs/GLOSSARY.md`
