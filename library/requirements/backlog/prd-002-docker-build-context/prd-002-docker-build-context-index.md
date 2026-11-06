# PRD-002: Add .dockerignore and close build-context leaks

> **Status:** Backlog
> **Priority:** P1
> **Effort:** S (1-3h) (estimate, not a commitment; about 1.5h)
> **Schema changes:** None

---

## Overview

Root cause: No .dockerignore, so docker build copies .env (FAL_KEY, GEMINI_API_KEY), .git and caches into the image. Impact: A built or pushed image can carry paid provider keys and full git history.

Work package WP-002. Wave: **Now**. Owner Drone: `devops-wasp-drone`. Risk: low. Depends on: None.

Findings closed: SEC-GEN-003, FND-ENV-004 (merged duplicates: SEC-POLY-004).

---

## Goals

- A `.dockerignore` keeps `.env*`, `.git`, `.gg`, `.venv`, `node_modules`, caches, `data/` and audio files out of the build context.
- `.gitignore` covers common generated folders.

## Non-Goals

- Rotating keys (owner action if an image was ever pushed; see open questions).
- Moving test deps out of the image (PRD-009).

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Whole context copied | SOURCE_OBSERVED | `Dockerfile:5 (`COPY . .`)` | 29c84e47 | 2026-11-06 | devops-wasp-drone |
| Base image unpinned | SOURCE_OBSERVED | `Dockerfile:1` | 29c84e47 | 2026-11-06 | devops-wasp-drone |
| No .dockerignore | SOURCE_OBSERVED | `repository root (file absent at 29c84e47)` | 29c84e47 | 2026-11-06 | devops-wasp-drone |
| .gitignore gaps | SOURCE_OBSERVED | `.gitignore:28-32` | 29c84e47 | 2026-11-06 | devops-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | devops-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a `.env` containing a synthetic marker value, when `docker build` runs, then `docker run --rm IMAGE ls -a /app` shows no `.env`, `.git`, `.gg`, `node_modules` or `data`. | SEC-GEN-003, SEC-POLY-004 |
| AC-2 | Given the image, when searched for the synthetic marker, then no match is found. | SEC-GEN-003 |
| AC-3 | Given `.gitignore`, when compared with the get-started-stinger template, then every generated folder in the template is ignored or a reason is recorded. | FND-ENV-004 |
| AC-4 | Given Dockerfile:1, when read, then `python:3.11-slim` is pinned by digest with a version comment. | SEC-POLY-004 |
| AC-5 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-GEN-003, FND-ENV-004, SEC-POLY-004 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Prefer an allowlist COPY (`apps/`, `requirements.txt`, Python package files) plus `.dockerignore` as a second layer. Never write real key values into tests.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Has any image built from this repo ever been pushed to a registry? If yes, the owner should rotate FAL_KEY and GEMINI_API_KEY.
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [security/trust-boundaries.md](../../../knowledge/private/security/trust-boundaries.md) (written in parallel by knowledge-wasp-drone)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
