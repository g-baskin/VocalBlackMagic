# PRD-010: Make generation responses, errors and logs honest and bounded

> **Status:** Backlog
> **Priority:** P3
> **Effort:** L (1-3d) (estimate, not a commitment; about 9.5h)
> **Schema changes:** None

---

## Overview

Root cause: Lyria results are buffered whole, provider errors are logged verbatim and mis-classified, and health/UX messages misstate why generation is off. Impact: Prompts and lyrics can leak into logs, large songs exhaust memory, and users get misleading errors.

Work package WP-010. Wave: **Later**. Owner Drone: `typescript-node-wasp-drone`. Risk: medium. Depends on: [PRD-004](../prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md).

Findings closed: SEC-GEN-011, SEC-GEN-012, SEC-GEN-013, QA-REL-001, QA-ERR-002, QA-UX-001, QA-ERR-003.

---

## Goals

- Provider responses are size-bounded before parsing and large audio is not returned as inline base64.
- Logs contain status and provider error codes only.
- User-facing errors and health output state the true reason.

## Non-Goals

- Spend caps and auth (PRD-004, PRD-005).
- Persistent object storage design beyond what audio delivery needs.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| 160 MB cap, buffered | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/audio.ts:5, apps/ttb-studio/src/lib/server/music/lyria.ts:115` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Inline base64 response | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/api/generations/+server.ts:100-108` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Provider bodies logged | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/fal.ts:63-65, :120, apps/ttb-studio/src/lib/server/music/lyria.ts:90-91, apps/ttb-studio/src/lib/server/music/errors.ts:13` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Lyria has no store:false (lyricist does) | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/lyria.ts:86 vs apps/ttb-studio/src/lib/server/music/lyricist.ts:108` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Non-JSON reply misclassified | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/fal.ts:92, 115, 151, apps/ttb-studio/src/lib/server/music/errors.ts:16-27` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Blocking 5-minute call, no cancel | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/lyria.ts:79-88` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Misleading UI message | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/+page.svelte:53-55` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Hardcoded health | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/api/health/+server.ts:3-10` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | typescript-node-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a Lyria response larger than the agreed cap, when received, then the route returns 413 or 502 without buffering more than the cap. | SEC-GEN-011 |
| AC-2 | Given a provider error body containing a synthetic prompt marker, when handled, then server logs contain the status and error code but not the marker. | SEC-GEN-012 |
| AC-3 | Given a Lyria request, when built, then it sets `store: false` if the API supports it, and docs/RIGHTS_AND_SAFETY.md names fal and Google retention. | SEC-GEN-013 |
| AC-4 | Given the client aborts, when a Lyria call is in flight, then the outbound fetch is aborted (test with AbortController). | QA-REL-001 |
| AC-5 | Given a provider returns 200 with non-JSON, when parsed, then the user sees "returned an unexpected response" with status 502, not "could not be reached". | QA-ERR-002 |
| AC-6 | Given NODE_ENV is not development, when the page loads, then the message names the development-only gate, not missing keys. | QA-UX-001 |
| AC-7 | Given /api/health, when called, then readiness derives from buildCapabilities and version matches apps/ttb-studio/package.json or is omitted. | QA-ERR-003 |
| AC-8 | Given the work package is merged, when the security, quality audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-GEN-011, SEC-GEN-012, SEC-GEN-013, QA-REL-001, QA-ERR-002, QA-UX-001, QA-ERR-003 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Keep "no fake completion": a cap breach returns an error, never a truncated "completed" job.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-001 Music generation request](../../../knowledge/private/contracts/CTR-001-music-generation-request.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] Replace inline base64 with a stored object URL now, or only cap it? Storage implies private, tenant-scoped access (AGENTS.md).
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [architecture/music-generation-pipeline.md](../../../knowledge/private/architecture/music-generation-pipeline.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-004](../prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
