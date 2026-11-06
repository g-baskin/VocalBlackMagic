# PRD-012: Protect main and add CODEOWNERS, CONTRIBUTING and SECURITY

> **Status:** Backlog
> **Priority:** P2
> **Effort:** M (3-8h) (estimate, not a commitment; about 3.75h)
> **Schema changes:** None

---

## Overview

Root cause: Repository governance files and branch rules were never set up. Impact: Unreviewed pushes can reach main, and vulnerability reporters have no channel.

Work package WP-012. Wave: **Next**. Owner Drone: `github-repo-health-wasp-drone`. Risk: low. Depends on: None.

Findings closed: FND-REPO-003, FND-REPO-001, FND-DOCS-005, FND-DOCS-006, SEC-GEN-009.

---

## Goals

- main requires a pull request, passing CI and Code Owner review, and blocks force pushes.
- CODEOWNERS, CONTRIBUTING.md and SECURITY.md exist.

## Non-Goals

- Rewriting AGENTS.md content; the AGENTS.md question below is the owner's call.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| No protection on main | SOURCE_OBSERVED | `GitHub settings (no ruleset at audit time)` | 29c84e47 | 2026-11-06 | github-repo-health-wasp-drone |
| No CODEOWNERS, CONTRIBUTING, SECURITY | SOURCE_OBSERVED | `repository root and .github/ (absent at 29c84e47)` | 29c84e47 | 2026-11-06 | github-repo-health-wasp-drone |
| AGENTS.md addresses coding agents | SOURCE_OBSERVED | `AGENTS.md:1-3` | 29c84e47 | 2026-11-06 | github-repo-health-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | github-repo-health-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a direct push to main, when attempted, then GitHub rejects it; evidence is the ruleset export or a failed push log. | FND-REPO-003 |
| AC-2 | Given a pull request touching a path in CODEOWNERS, when opened, then the named owner is requested for review. | FND-REPO-001 |
| AC-3 | Given the repository root, when listed, then CONTRIBUTING.md and SECURITY.md exist and SECURITY.md names a private reporting channel. | FND-DOCS-005, FND-DOCS-006 |
| AC-4 | Given AGENTS.md, when changed, then the change requires Code Owner review (CODEOWNERS entry), recording the owner's decision on SEC-GEN-009. | SEC-GEN-009 |
| AC-5 | Given the work package is merged, when the foundation, security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids FND-REPO-003, FND-REPO-001, FND-DOCS-005, FND-DOCS-006, SEC-GEN-009 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Ruleset creation is a Settings action for a human (or `gh api` with owner approval).

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] SEC-GEN-009 dispute: the audit reported AGENTS.md as a file addressing AI agents (prompt-injection tag); the owner may consider it intended project guidance. Accept as-is with Code Owner review, or reword? (owner decision)
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
