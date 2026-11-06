# PRD-001: Characterization tests for generation, dev gates and Vocal Fix routes

> **Status:** Backlog
> **Priority:** P1
> **Effort:** M (3-8h) (estimate, not a commitment; about 5.75h)
> **Schema changes:** None

---

## Overview

Root cause: Only the shared validator and Python contracts have tests; the SvelteKit routes that later packages will change have none. Impact: Later security fixes can't be checked safely; a regression in the dev-only gate or generation route would go unnoticed.

Work package WP-001. Wave: **Now**. Owner Drone: `testing-coach-wasp-drone`. Risk: low. Depends on: None.

Findings closed: QA-TEST-001, QA-TEST-002.

---

## Goals

- Every route and gate that PRD-003, PRD-004, PRD-005, PRD-006 and PRD-010 will change has a named test that pins today's behavior.
- `bun run test` covers `apps/vocal-fix/src` as well as `packages` and `apps/ttb-studio/src`.

## Non-Goals

- Changing any route behavior (tests record current behavior, including known gaps, as characterization).
- GPU, browser or load tests.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Test script omits Vocal Fix | SOURCE_OBSERVED | `package.json:19 (`bun test packages apps/ttb-studio/src`)` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| Generation route untested | SOURCE_OBSERVED | `apps/ttb-studio/src/routes/api/generations/+server.ts:22-114` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| Dev gate untested | SOURCE_OBSERVED | `apps/ttb-studio/src/lib/server/music/gate.ts:1-12` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| Vocal Fix proxy untested | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/api/references/+server.ts:5-51` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| Validator tests cover few branches | SOURCE_OBSERVED | `packages/contracts/src/index.test.ts:15-27 vs packages/contracts/src/index.ts:71-91` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| ROADMAP test list | SOURCE_OBSERVED | `docs/ROADMAP.md:39-45` | 29c84e47 | 2026-11-06 | testing-coach-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | testing-coach-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given NODE_ENV=production, when POST /api/generations, GET /api/generations/[id] and GET /api/generations/[id]/audio are called, then each returns 403 and the stubbed fetch is never called. | QA-TEST-001 |
| AC-2 | Given NODE_ENV=development and a stubbed fetch, when the generation route receives invalid JSON, a wrong content type, a validation failure, an unimplemented engine and a missing key, then it returns 400, 415, 422, 501 and 503 respectively. | QA-TEST-001 |
| AC-3 | Given NODE_ENV=production, when Vocal Fix references POST, GET and DELETE are called, then each returns 403 and the upstream is not contacted. | QA-TEST-001 |
| AC-4 | Given `bun run test`, when it runs, then files under `apps/vocal-fix/src` are executed (test count includes them). | QA-TEST-001 |
| AC-5 | Given `packages/contracts/src/index.ts` `validateGenerationRequest`, when the suite runs, then each return branch at lines 72-89 has a test, and deliberately breaking one branch fails exactly that test. | QA-TEST-002 |
| AC-6 | Given the work package is merged, when the quality audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids QA-TEST-001, QA-TEST-002 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Write tests before any other package changes behavior. Stub `fetch`; never call fal or Google from tests. Set and restore NODE_ENV per test (no shared mutable fixtures).

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [architecture/test-strategy.md](../../../knowledge/private/architecture/test-strategy.md) (written in parallel by knowledge-wasp-drone)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
