# PRD-003: Lock the Python Vocal Fix API behind a service token, loopback binding and owner checks

> **Status:** Backlog
> **Priority:** P0
> **Effort:** L (1-3d) (estimate, not a commitment; about 10h)
> **Schema changes:** Additive

---

## Overview

Root cause: FastAPI routes have no auth dependency or owner check; the container listens on 0.0.0.0. Impact: Anyone who can reach the port can read or delete voice recordings and consent records.

Work package WP-003. Wave: **Now**. Owner Drone: `python-wasp-drone`. Risk: medium. Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md).

Findings closed: SEC-POLY-001, SEC-GEN-001.

---

## Goals

- Every `/api/references` route on the Python Vocal Fix API rejects requests without a valid service token.
- Session manifests record an owner and reads or deletes by another owner return 404.
- The container listens only where the SvelteKit server can reach it.

## Non-Goals

- End-user login (PRD-005). This PRD forwards owner values; it does not verify users.
- Upload limits and content sniffing (PRD-006).
- Splitting the API into a separate microservice; it stays the private audio worker inside the modular monolith (docs/decisions/0002-modular-monolith.md).

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| No auth dependency on routes | SOURCE_OBSERVED | `apps/vocal_fix/app.py:75-153` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| GET and DELETE with no owner check | SOURCE_OBSERVED | `apps/vocal_fix/app.py:144-153` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Bound to all interfaces in container | SOURCE_OBSERVED | `compose.yaml:4, Dockerfile:10` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Published on loopback only | SOURCE_OBSERVED | `compose.yaml:10` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Proxy sends no credential | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/api/references/+server.ts:39-46` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | python-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a request to any `/api/references` route without the service token, when it reaches the Python API, then the response is 401 and no file or folder is created, read or deleted. | SEC-POLY-001 |
| AC-2 | Given a session created for tenant A, when tenant B requests GET or DELETE on that id, then the response is 404 and the folder still exists. | SEC-GEN-001 |
| AC-3 | Given the SvelteKit proxy, when it forwards a request, then it attaches the token from server environment and owner values from server-side state only (test asserts browser-supplied owner headers are dropped). | SEC-POLY-001 |
| AC-4 | Given compose and the systemd units, when started, then the API is reachable only from the loopback or private network address documented in the trust-boundaries doc. | SEC-GEN-001 |
| AC-5 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-POLY-001, SEC-GEN-001 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Add a FastAPI dependency comparing the bearer token with `hmac.compare_digest`; fail closed when the token env var is unset. Store `tenant_id` and `subject` in manifest.json. Preserve original raw uploads; never rewrite them. Write characterization tests (PRD-001) first.

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-002 Vocal reference upload API](../../../knowledge/private/contracts/CTR-002-vocal-reference-upload-api.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.
- [CTR-003 Session identity](../../../knowledge/private/contracts/CTR-003-session-identity.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] Is a service token plus loopback binding acceptable as the interim lock until PRD-005 provides verified users? (owner decision)
- [ ] What happens to existing sessions in VFM_DATA_DIR without owner fields: delete, or assign to an operator tenant?
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [security/trust-boundaries.md](../../../knowledge/private/security/trust-boundaries.md) (written in parallel by knowledge-wasp-drone)
- Knowledge: [architecture/vocal-reference-storage.md](../../../knowledge/private/architecture/vocal-reference-storage.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
