# PRD-015: Prune unused workspace deps, exports and the repeated route handler

> **Status:** Backlog
> **Priority:** P3
> **Effort:** S (1-3h) (estimate, not a commitment; about 2.25h)
> **Schema changes:** None

---

## Overview

Root cause: Both apps declare auth/database/billing deps they never import, and some music helpers are exported but only used locally. Impact: Minor maintenance noise.

Work package WP-015. Wave: **Later**. Owner Drone: `typescript-node-wasp-drone`. Risk: low. Depends on: [PRD-005](../prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md).

Findings closed: BLOAT-DEAD-002, BLOAT-DEAD-004, BLOAT-DUP-001.

---

## Goals

- No declared-but-unused workspace deps, no local-only exports, one shared forward helper in the session route.

## Non-Goals

- Deduplicating app.css across apps; ADR 0001 keeps the apps independent.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Unused deps | SOURCE_OBSERVED | `apps/ttb-studio/package.json:15-17, apps/vocal-fix/package.json:15-17` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Local-only exports | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/audio.ts:4-5, apps/ttb-studio/src/lib/server/music/fal.ts:8, apps/ttb-studio/src/lib/server/music/lyria.ts:7` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Repeated handler | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:6-45` | 29c84e47 | 2026-11-06 | typescript-node-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | typescript-node-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given knip, when run, then the auth, database and billing deps are not reported (removed or listed in ignoreDependencies with a "planned" comment) unless PRD-005 has imported them. | BLOAT-DEAD-002 |
| AC-2 | Given knip, when run, then the five music exports are not reported, and build and tests pass. | BLOAT-DEAD-004 |
| AC-3 | Given the session route, when read, then GET and DELETE call one forward helper, and PRD-001 route tests still pass. | BLOAT-DUP-001 |
| AC-4 | Given the work package is merged, when the bloat audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids BLOAT-DEAD-002, BLOAT-DEAD-004, BLOAT-DUP-001 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Run after PRD-005 so auth deps are either used or removed once.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Depends on: [PRD-005](../prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
