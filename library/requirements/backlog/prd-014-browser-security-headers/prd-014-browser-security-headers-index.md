# PRD-014: Send CSP and security headers from both SvelteKit apps

> **Status:** Backlog
> **Priority:** P3
> **Effort:** XS (< 1h) (estimate, not a commitment; about 0.75h)
> **Schema changes:** None

---

## Overview

Root cause: No CSP or other security headers are configured in either app. Impact: No defense in depth against XSS or clickjacking.

Work package WP-014. Wave: **Later**. Owner Drone: `sveltekit-security-wasp-drone`. Risk: medium. Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md).

Findings closed: SEC-SVELTE-003.

---

## Goals

- Both apps send a CSP plus X-Content-Type-Options, Referrer-Policy and frame-ancestors none.

## Non-Goals

- Sharing config between apps (ADR 0001); each app configures its own.

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| No CSP in either app | SOURCE_OBSERVED | `apps/ttb-studio/vite.config.ts:5-7, apps/vocal-fix/vite.config.ts:5-7` | 29c84e47 | 2026-11-06 | sveltekit-security-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | sveltekit-security-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given each app's production build, when a page is requested, then the response has a Content-Security-Policy with `default-src 'self'`, `frame-ancestors 'none'` and `media-src` allowing blob:, and the page still plays generated audio. | SEC-SVELTE-003 |
| AC-2 | Given an API response, when inspected, then X-Content-Type-Options nosniff and a Referrer-Policy are set. | SEC-SVELTE-003 |
| AC-3 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-SVELTE-003 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Add `csp` to the sveltekit() options and headers in a handle hook (created in PRD-005 if it lands first).

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- None; no shared boundary identified.

---

## Open questions

- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [security/trust-boundaries.md](../../../knowledge/private/security/trust-boundaries.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-001](../prd-001-test-safety-net/prd-001-test-safety-net-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
