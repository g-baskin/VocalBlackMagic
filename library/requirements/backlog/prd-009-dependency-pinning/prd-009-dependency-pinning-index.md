# PRD-009: Lock Python dependencies, pin runtimes and automate updates

> **Status:** Backlog
> **Priority:** P2
> **Effort:** M (3-8h) (estimate, not a commitment; about 5.25h)
> **Schema changes:** None

---

## Overview

Root cause: Python uses version ranges with no lockfile, test tools ship at runtime, runtimes aren't pinned and nothing proposes updates. Impact: The deployed dependency set can't be audited or reproduced; two known advisories stay in the lockfile.

Work package WP-009. Wave: **Next**. Owner Drone: `dependency-audit-wasp-drone`. Risk: low. Depends on: [PRD-008](../prd-008-ci-hardening/prd-008-ci-hardening-index.md).

Findings closed: FND-CI-051, SEC-GEN-006, FND-DEPS-006, FND-DEPS-007, SEC-GEN-007, SEC-GEN-008, QA-DEP-001.

---

## Goals

- Python installs are reproducible from a hashed lock.
- Runtimes are pinned and updates are proposed automatically.
- Known advisories in bun.lock are resolved.

## Non-Goals

- Upgrading major framework versions.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Ranges, no lock | SOURCE_OBSERVED | `requirements.txt:1-4` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| Test tools at runtime | SOURCE_OBSERVED | `requirements.txt:5-6, Dockerfile:4` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| CI installs ranges | SOURCE_OBSERVED | `.github/workflows/ci.yml:32-33` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| deepmerge 4.3.1 | SOURCE_OBSERVED | `bun.lock:255` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| minimatch 10.2.6 | SOURCE_OBSERVED | `bun.lock:485` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| No dependabot.yml, no .python-version or .nvmrc | SOURCE_OBSERVED | `.github/ (absent at 29c84e47)` | 29c84e47 | 2026-11-06 | dependency-audit-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | dependency-audit-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a fresh environment, when installing with `--require-hashes` from the committed lock, then the install succeeds and CI uses the same command. | FND-CI-051, SEC-GEN-006 |
| AC-2 | Given requirements.txt, when read, then pytest and httpx are absent and appear only in dev requirements; the image does not contain pytest. | QA-DEP-001 |
| AC-3 | Given the repository, when inspected, then `.python-version` (or `requires-python`) and a Node/Bun pin exist and match CI. | FND-DEPS-007 |
| AC-4 | Given `.github/dependabot.yml`, when GitHub parses it, then pip, bun/npm and github-actions ecosystems are listed. | FND-DEPS-006 |
| AC-5 | Given bun.lock, when the dependency audit runs, then the deepmerge and minimatch advisories are not reported. | SEC-GEN-007, SEC-GEN-008 |
| AC-6 | Given the work package is merged, when the foundation, security, quality audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids FND-CI-051, SEC-GEN-006, FND-DEPS-006, FND-DEPS-007, SEC-GEN-007, SEC-GEN-008, QA-DEP-001 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Update docs/RELEASING.md:24 install line in PRD-011 or here, whichever lands first, and note it in the other.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Depends on: [PRD-008](../prd-008-ci-hardening/prd-008-ci-hardening-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
