# PRD-004: Put spend caps, rate limits and a real auth check in front of paid generation

> **Status:** Backlog
> **Priority:** P0
> **Effort:** L (1-3d) (estimate, not a commitment; about 21h)
> **Schema changes:** Additive

---

## Overview

Root cause: The only thing protecting fal/Lyria calls is NODE_ENV === 'development'; there's no login, rate limit or spend cap. Impact: Anyone who can reach a dev server can spend the owner's paid provider credit.

Work package WP-004. Wave: **Now**. Owner Drone: `sveltekit-security-wasp-drone`. Risk: medium. Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md).

Findings closed: SEC-GEN-010, SEC-SVELTE-002.

---

## Goals

- Paid fal and Lyria calls happen only after an explicit opt-in, a rate-limit check and a spend-cap check.
- Job status and audio routes are bound to the requester once identity exists.

## Non-Goals

- Full login (PRD-005); until then the guard keys on a single local operator.
- Provider error and buffering changes (PRD-010).
- Billing integration (`packages/billing`).

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Only control is NODE_ENV | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/gate.ts:1-4` | 29c84e47 | 2026-11-06 | sveltekit-security-wasp-drone |
| Route calls providers after the gate only | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/api/generations/+server.ts:22-24, 75, 100` | 29c84e47 | 2026-11-06 | sveltekit-security-wasp-drone |
| fal request uses thinking mode (2x cost) | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/fal.ts:44-50` | 29c84e47 | 2026-11-06 | sveltekit-security-wasp-drone |
| Job routes check only the gate | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:9-11, apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:9-11` | 29c84e47 | 2026-11-06 | sveltekit-security-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | sveltekit-security-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given NODE_ENV=development without the explicit opt-in variable, when POST /api/generations is called, then it returns 403 and no provider fetch occurs. | SEC-GEN-010 |
| AC-2 | Given the configured rate limit N per window, when N+1 requests arrive in one window, then request N+1 returns 429 and no provider fetch occurs. | SEC-GEN-010, SEC-SVELTE-002 |
| AC-3 | Given the configured spend cap is reached (estimated cost recorded per call, persisted across restarts), when another generation is requested, then it returns 429 and no provider fetch occurs. | SEC-GEN-010 |
| AC-4 | Given a job created by subject A, when subject B polls [id] or [id]/audio, then the response is 404 (enforced once CTR-003 is accepted and PRD-005 lands). | SEC-SVELTE-002 |
| AC-5 | Given the dev server, when started by the package script, then it binds to 127.0.0.1 (already true at apps/ttb-studio/package.json:7) and a test or check guards that. | SEC-GEN-010 |
| AC-6 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-GEN-010, SEC-SVELTE-002 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Order inside POST: gate, opt-in, session (when available), rate limit, spend reservation, provider call, settle actual cost. Counters must persist (file or database), not module memory. Also set hard limits in the fal and Google Cloud consoles (owner action). Do not fake completion when blocked.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-001 Music generation request](../../../knowledge/private/contracts/CTR-001-music-generation-request.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.
- [CTR-003 Session identity](../../../knowledge/private/contracts/CTR-003-session-identity.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] What development spend cap (per day and per month) and rate limit (requests per minute per user) should apply to fal and Lyria? (owner decision)
- [ ] Should ACE-Step `thinking: true` (2x cost) stay the default?
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [architecture/music-generation-pipeline.md](../../../knowledge/private/architecture/music-generation-pipeline.md) (written in parallel by knowledge-wasp-drone)
- Knowledge: [auth/session-and-tenancy-model.md](../../../knowledge/private/auth/session-and-tenancy-model.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
