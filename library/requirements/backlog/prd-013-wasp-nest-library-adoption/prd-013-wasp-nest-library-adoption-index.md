# PRD-013: Commit the Library scaffold and finish Wasp Nest setup

> **Status:** Backlog
> **Priority:** P1
> **Effort:** L (1-3d) (estimate, not a commitment; about 10h)
> **Schema changes:** None

---

## Overview

Root cause: The repo had no library/ or wasp-nest.lock; a scaffold now exists but isn't committed. Impact: Plans and knowledge docs have no durable home until this is committed.

Work package WP-013. Wave: **Now**. Owner Drone: `library-wasp-drone`. Risk: low. Depends on: None.

Findings closed: FND-LIB-001, FND-LIB-002.

---

## Goals

- library/ is committed and the Wasp Nest lock is created.

## Non-Goals

- Writing more Library content beyond this audit's approved files.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Library scaffold untracked | SOURCE_OBSERVED | `library/ (git status shows `?? library/`)` | 29c84e47 | 2026-11-06 | library-wasp-drone |
| No wasp-nest.lock | SOURCE_OBSERVED | `repository root (absent at 29c84e47)` | 29c84e47 | 2026-11-06 | library-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | library-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given `git ls-files library`, when run on main, then the scaffold, these PRDs and the approved knowledge docs are tracked. | FND-LIB-002 |
| AC-2 | Given the repository root, when listed, then `wasp-nest.lock` exists, produced by get-started-stinger `mark-repo-started.py`. | FND-LIB-001 |
| AC-3 | Given the work package is merged, when the foundation audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids FND-LIB-001, FND-LIB-002 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

The user reviews and commits; agents do not commit. `library/notes/` stays human-only.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
