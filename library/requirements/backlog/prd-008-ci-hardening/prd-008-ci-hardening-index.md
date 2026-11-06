# PRD-008: Pin CI actions to commits, freeze installs and add static analysis

> **Status:** Backlog
> **Priority:** P2
> **Effort:** S (1-3h) (estimate, not a commitment; about 3.0h)
> **Schema changes:** None

---

## Overview

Root cause: Workflows use movable action tags and run a non-frozen bun install. Impact: A compromised action tag or drifting dependency can change what CI runs.

Work package WP-008. Wave: **Next**. Owner Drone: `ci-release-wasp-drone`. Risk: low. Depends on: None.

Findings closed: SEC-POLY-005, FND-CI-003, FND-CI-050, FND-CI-010 (merged duplicates: SEC-GEN-005).

---

## Goals

- Every `uses:` is pinned to a full commit SHA.
- CI installs from the committed lockfile.
- A static analysis scan runs on pull requests.

## Non-Goals

- Python lockfile (PRD-009).
- Branch protection (PRD-012).

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Tag-pinned actions | SOURCE_OBSERVED | `.github/workflows/ci.yml:11, 12, 15, 28, 29` | 29c84e47 | 2026-11-06 | ci-release-wasp-drone |
| Non-frozen install and stale comment | SOURCE_OBSERVED | `.github/workflows/ci.yml:18-19` | 29c84e47 | 2026-11-06 | ci-release-wasp-drone |
| No CodeQL workflow | SOURCE_OBSERVED | `.github/workflows/ (only ci.yml)` | 29c84e47 | 2026-11-06 | ci-release-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | ci-release-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given ci.yml, when scanned, then every `uses:` value is a 40-character SHA with a version comment. | FND-CI-003, SEC-POLY-005, SEC-GEN-005 |
| AC-2 | Given a pull request that changes package.json without bun.lock, when CI runs, then `bun install --frozen-lockfile` fails the job. | FND-CI-050, SEC-GEN-005 |
| AC-3 | Given a pull request, when it opens, then a CodeQL (or equivalent) check runs for JavaScript/TypeScript and Python; evidence is a workflow run link. | FND-CI-010 |
| AC-4 | Given the work package is merged, when the foundation, security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-POLY-005, FND-CI-003, FND-CI-050, FND-CI-010, SEC-GEN-005 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Pair SHA pins with Dependabot github-actions updates (created in PRD-009).

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
