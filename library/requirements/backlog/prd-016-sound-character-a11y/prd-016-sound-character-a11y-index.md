# PRD-016: Tie the Sound character label to its controls

> **Status:** Backlog
> **Priority:** P3
> **Effort:** XS (< 1h) (estimate, not a commitment; about 0.75h)
> **Schema changes:** None

---

## Overview

Root cause: The label isn't programmatically associated (no fieldset/legend or aria). Impact: Screen-reader users can't tell what the controls are for.

Work package WP-016. Wave: **Later**. Owner Drone: `ux-ui-svelte-wasp-drone`. Risk: low. Depends on: None.

Findings closed: QA-A11Y-001.

---

## Goals

- Screen readers announce "Sound character" for the preset buttons.

## Non-Goals

- Wider accessibility audit.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Orphan label | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/+page.svelte:304-308` | 29c84e47 | 2026-11-06 | ux-ui-svelte-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | ux-ui-svelte-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given the TTB Studio page, when inspected with an accessibility tree tool, then the preset group has the accessible name "Sound character" (fieldset/legend or role=radiogroup with aria-labelledby). | QA-A11Y-001 |
| AC-2 | Given the work package is merged, when the quality audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids QA-A11Y-001 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Keep the selection state exposed (aria-pressed or aria-checked).

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
