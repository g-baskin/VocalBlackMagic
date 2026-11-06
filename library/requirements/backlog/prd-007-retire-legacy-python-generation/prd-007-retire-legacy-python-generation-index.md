# PRD-007: Retire the legacy Python TTB generation server and the duplicate HTML front ends

> **Status:** Backlog
> **Priority:** P2
> **Effort:** M (3-8h) (estimate, not a commitment; about 8.0h)
> **Schema changes:** None

---

## Overview

Root cause: The SvelteKit app replaced the Python generation bridge, but the endpoint, its HTML pages and the Compose service still run. Impact: An unauthenticated server that nothing uses is still exposed, and its request rules contradict the TypeScript contract.

Work package WP-007. Wave: **Next**. Owner Drone: `python-wasp-drone`. Risk: medium. Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md).

Findings closed: SEC-POLY-007, BLOAT-DEAD-001, BLOAT-DEAD-003, BLOAT-STRUCT-001, QA-VAL-001.

---

## Goals

- Nothing unused and unauthenticated is started by default.
- There is one authoritative generation request contract.

## Non-Goals

- Removing `apps/vocal_fix` (it remains the private audio worker).
- Building a GPU worker; if the Python TTB app is kept for that role, this PRD only aligns and documents it.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Legacy request model | SOURCE_OBSERVED | `apps/ttb_studio/app.py:19-32` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Legacy generation endpoint (503) | SOURCE_OBSERVED | `apps/ttb_studio/app.py:64-70` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Python-served pages | SOURCE_OBSERVED | `apps/ttb_studio/index.html, apps/vocal_fix/index.html, homepage routes apps/ttb_studio/app.py:35-37` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Compose still starts it | SOURCE_OBSERVED | `compose.yaml:11-15` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Orphaned TS bridge | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/backend.ts:1-24` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Tests depend on it | SOURCE_OBSERVED | `tests/test_apps.py:8, :62-80` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | python-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given `docker compose up` with defaults, when services list, then no `ttb-studio` Python service runs (or it is behind an explicit profile documented as not run by default). | SEC-POLY-007, BLOAT-DEAD-003 |
| AC-2 | Given the unused-code tool, when run, then `apps/ttb-studio/src/lib/server/backend.ts` is not reported because it is removed, and build and tests pass. | BLOAT-DEAD-001 |
| AC-3 | Given the repository, when searched, then no Python-served index.html front end remains for a product whose Svelte app is the supported UI, or the owner's decision to keep them is recorded. | BLOAT-STRUCT-001 |
| AC-4 | Given any remaining Python generation model, when compared with CTR-001, then engine list, duration and prompt trimming match, verified by a pytest case for `lyria-3.5` and `duration_seconds`. | QA-VAL-001 |
| AC-5 | Given the work package is merged, when the bloat, security, quality audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-POLY-007, BLOAT-DEAD-001, BLOAT-DEAD-003, BLOAT-STRUCT-001, QA-VAL-001 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Characterization tests first (PRD-001). Move the useful assertions in tests/test_apps.py (no fake audio, invalid values rejected) to Svelte route tests before deleting. Update docs in PRD-011, not here.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-001 Music generation request](../../../knowledge/private/contracts/CTR-001-music-generation-request.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] May the legacy Python TTB generation endpoint (apps/ttb_studio) be deleted, or is it the planned GPU worker? (owner decision)
- [ ] May both Python HTML pages (apps/ttb_studio/index.html, apps/vocal_fix/index.html) be deleted? (owner decision)
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [architecture/music-generation-pipeline.md](../../../knowledge/private/architecture/music-generation-pipeline.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
