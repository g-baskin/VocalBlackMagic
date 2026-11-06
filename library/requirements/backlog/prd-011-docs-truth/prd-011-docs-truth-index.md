# PRD-011: Bring README, ROADMAP and docs in line with what the apps really do

> **Status:** Backlog
> **Priority:** P2
> **Effort:** S (1-3h) (estimate, not a commitment; about 3.0h)
> **Schema changes:** None

---

## Overview

Root cause: Docs were written before hosted generation shipped and weren't updated. Impact: Contributors and agents act on false claims (for example that generation is unavailable, or a test command that runs 6 of 37 tests).

Work package WP-011. Wave: **Next**. Owner Drone: `readme-writing-wasp-drone`. Risk: low. Depends on: None.

Findings closed: QA-DOC-001, QA-DOC-002, QA-DOC-003, FND-DOCS-050.

---

## Goals

- README, GLOSSARY, SAAS_STACK, ARCHITECTURE, ROADMAP and RELEASING describe what the apps do at the merge commit.
- The documented test command is `bun run test`.

## Non-Goals

- Writing new knowledge docs (separate rows of the approved list).
- Marketing copy.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Says generation unavailable | SOURCE_OBSERVED | `README.md:9, :19, :82, docs/GLOSSARY.md:9, :19-20, docs/SAAS_STACK.md:9, docs/ARCHITECTURE.md:38` | 29c84e47 | 2026-11-06 | readme-writing-wasp-drone |
| Narrow test command | SOURCE_OBSERVED | `README.md:74, docs/RELEASING.md:19` | 29c84e47 | 2026-11-06 | readme-writing-wasp-drone |
| Stale roadmap boxes | SOURCE_OBSERVED | `docs/ROADMAP.md:50-53` | 29c84e47 | 2026-11-06 | readme-writing-wasp-drone |
| Stale CI and ignore comments | SOURCE_OBSERVED | `.github/workflows/ci.yml:18, .gitignore:32` | 29c84e47 | 2026-11-06 | readme-writing-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | readme-writing-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given the docs listed, when read, then each describes dev-only hosted generation (fal ACE-Step, Google Lyria), the 403 production gate and 501 for heartmula and external-v2. | QA-DOC-001, FND-DOCS-050 |
| AC-2 | Given README.md and docs/RELEASING.md, when searched, then `bun test packages` is replaced by `bun run test`. | QA-DOC-003, FND-DOCS-050 |
| AC-3 | Given docs/ROADMAP.md and the ci.yml and .gitignore comments, when compared with the repo, then each checkbox and comment matches observed state (Doc drift items D20-D23, D29-D30 in the audit notes). | QA-DOC-002 |
| AC-4 | Given the work package is merged, when the quality, foundation audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids QA-DOC-001, QA-DOC-002, QA-DOC-003, FND-DOCS-050 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Doc drift list: 03-quality/notes.md in the audit workspace (items D1-D12, D17-D19, D26). The ci.yml:18 comment may instead be removed by PRD-008; coordinate.

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
