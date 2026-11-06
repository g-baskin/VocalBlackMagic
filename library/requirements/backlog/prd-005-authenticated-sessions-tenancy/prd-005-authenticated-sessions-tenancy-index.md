# PRD-005: Replace the auth stub with a verified session and tenant layer for both apps

> **Status:** Backlog
> **Priority:** P2
> **Effort:** L (1-3d) (estimate, not a commitment; about 16.75h)
> **Schema changes:** Additive

---

## Overview

Root cause: packages/auth assertAuthenticated trusts any object it is given; there's no verified session, so the SvelteKit routes have no owner scope. Impact: Without this the apps can't be exposed outside development (AGENTS.md production-ready bar).

Work package WP-005. Wave: **Next**. Owner Drone: `auth-wasp-drone`. Risk: high. Depends on: [PRD-003](../prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md), [PRD-004](../prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md).

Findings closed: SEC-SVELTE-001, SEC-POLY-006.

---

## Goals

- Both apps resolve a verified session in `hooks.server.ts` and every tenant or paid route requires it.
- `assertAuthenticated` can no longer be satisfied by a forged object.

## Non-Goals

- Choosing a vendor inside this PRD without an owner decision.
- Merging the two apps or sharing runtime state between them (ADR 0001).
- Removing the NODE_ENV gates; that is a separate reviewed step after tests pass.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Guard trusts any object | SOURCE_OBSERVED | `packages/auth/src/index.ts:11-15` | 29c84e47 | 2026-11-06 | auth-wasp-drone |
| No hooks.server.ts in either app | SOURCE_OBSERVED | `apps/ttb-studio/src, apps/vocal-fix/src (absent at 29c84e47)` | 29c84e47 | 2026-11-06 | auth-wasp-drone |
| Vocal Fix routes gate only on NODE_ENV | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/api/references/+server.ts:7, apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:7, :27` | 29c84e47 | 2026-11-06 | auth-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | auth-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given an object literal with all `SaaSSession` fields, when passed to the guard, then type checking fails and the runtime guard rejects it with 401. | SEC-POLY-006 |
| AC-2 | Given no or an expired session cookie, when any Vocal Fix references route is called, then it returns 401 and the Python API is not contacted. | SEC-SVELTE-001 |
| AC-3 | Given a session for tenant A, when it reads or deletes tenant B's reference session, then the response is 404. | SEC-SVELTE-001 |
| AC-4 | Given both apps, when built, then each has its own hooks.server.ts that sets `locals.session` and neither imports the other app. | SEC-SVELTE-001 |
| AC-5 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-SVELTE-001, SEC-POLY-006 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Implement CTR-003 in `packages/auth`. Record consent audit trail fields alongside the owner (AGENTS.md production bar). Use the auth-stinger guidance for provider choice.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-003 Session identity](../../../knowledge/private/contracts/CTR-003-session-identity.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.
- [CTR-002 Vocal reference upload API](../../../knowledge/private/contracts/CTR-002-vocal-reference-upload-api.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] Which identity provider? (owner decision)
- [ ] Do both apps share one tenant namespace?
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [auth/session-and-tenancy-model.md](../../../knowledge/private/auth/session-and-tenancy-model.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-003](../prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md)
- Depends on: [PRD-004](../prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
