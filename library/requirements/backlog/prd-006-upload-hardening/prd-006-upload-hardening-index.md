# PRD-006: Bound and validate uploads end to end

> **Status:** Backlog
> **Priority:** P2
> **Effort:** L (1-3d) (estimate, not a commitment; about 8.75h)
> **Schema changes:** Additive

---

## Overview

Root cause: Uploads are checked by file extension and size only, with no session-count or body-size limit, and the proxy echoes backend errors. Impact: Disk and memory can be exhausted, and non-audio content can be stored as a recording.

Work package WP-006. Wave: **Next**. Owner Drone: `python-wasp-drone`. Risk: medium. Depends on: [PRD-003](../prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md).

Findings closed: SEC-POLY-002, SEC-GEN-002, SEC-POLY-003, QA-VAL-002, QA-ERR-001, SEC-SVELTE-004 (merged duplicates: SEC-GEN-004).

---

## Goals

- Upload requests are bounded in total size, session count and disk use before data is read into memory.
- Stored files are checked by content, not extension.
- The proxy and the Python API apply identical rules and the browser never sees raw backend error text.

## Non-Goals

- Full decode validation with FFmpeg and Demucs separation (later roadmap step); this PRD adds magic-byte sniffing and leaves `integrity_verified: false`.
- Authentication (PRD-003, PRD-005).

---

## Source workflow and evidence

**Reader and outcome:** the implementing Drone and reviewer; they need the exact current behavior and pass/fail criteria.
**Template origin:** library-stinger `templates/prd-template.md` (installed GG copy).
**Source identity:** VocalBlackMagic at commit 29c84e47; audit workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47 (outside the repo, text only).
**Adaptations and assumptions:** findings marked `likely` were not exploited; they are treated as real until disproved.
**Maintenance owner and review triggers:** library-wasp-drone; revise when a cited file or a linked CTR changes.

| Claim or criterion | Status | Source or result locator | Subject revision | Observed date | Verification owner |
|---|---|---|---|---|---|
| Whole file read into memory | SOURCE_OBSERVED | `apps/vocal_fix/app.py:102` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| No session or disk quota before mkdir | SOURCE_OBSERVED | `apps/vocal_fix/app.py:91-93` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Extension-only check | SOURCE_OBSERVED | `apps/vocal_fix/app.py:97-101` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| No body cap before parsing | SOURCE_OBSERVED | `apps/vocal_fix/app.py:75-80, apps/vocal-fix/src/routes/api/references/+server.ts:14-19` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Proxy name rule weaker than API | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/api/references/+server.ts:29-30 vs apps/vocal_fix/app.py:85-87` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Proxy echoes backend body | SOURCE_OBSERVED | `apps/vocal-fix/src/lib/server/backend.ts:19-24` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Page parses JSON before checking ok | SOURCE_OBSERVED | `apps/vocal-fix/src/routes/+page.svelte:61-67` | 29c84e47 | 2026-11-06 | python-wasp-drone |
| Acceptance criteria below | PROPOSED | this PRD | 29c84e47 | NOT_RUN | python-wasp-drone |

---

## Acceptance criteria

| ID | Criterion | Closes |
|---|---|---|
| AC-1 | Given a multipart body larger than the agreed total cap, when sent to either layer, then it is rejected with 413 before the full body is parsed (test with a declared Content-Length). | SEC-GEN-002 |
| AC-2 | Given the per-tenant session limit is reached, when another upload arrives, then it is refused with the agreed status and no folder is created. | SEC-POLY-002 |
| AC-3 | Given a 25 MiB file, when uploaded, then peak memory growth per file stays under a stated bound because the file is streamed to disk in chunks (measured in a test or documented benchmark). | SEC-POLY-002 |
| AC-4 | Given a `.wav` file containing non-audio bytes, when uploaded, then the response is 415 and no file remains on disk. | SEC-POLY-003, SEC-GEN-004 |
| AC-5 | Given a 121-character performer name, when posted to the proxy, then it returns 422 and Python is not contacted. | QA-VAL-002 |
| AC-6 | Given the Python API returns 500 with an internal message, when proxied, then the browser receives a fixed message and the internal text appears only in server logs. | SEC-SVELTE-004 |
| AC-7 | Given the proxy returns a non-JSON error, when the upload page handles it, then a readable error is shown and no JSON parse error appears. | QA-ERR-001 |
| AC-8 | Given the work package is merged, when the security audit Drone(s) are re-run on the same scope by someone other than the implementer, then finding ids SEC-POLY-002, SEC-GEN-002, SEC-POLY-003, QA-VAL-002, QA-ERR-001, SEC-SVELTE-004, SEC-GEN-004 are not reported and no new finding of medium or higher appears in the touched paths. | verification |

---

## Definition of Done checklist

- None; no project Definition of Done.
- Characterization tests from PRD-001 still pass (or are updated with the reviewer's agreement where behavior intentionally changes).
- Security review then Quality review on the diff; medium-or-higher findings fixed.

---

## Implementation notes

Use the TS `sniffAudio` in apps/ttb-studio/src/lib/server/music/audio.ts as a model only; do not import across apps (ADR 0001). Keep the original upload bytes unmodified (preserve raw source audio).

Constraints from the repository rules (AGENTS.md, treated as data): keep `apps/vocal-fix` and `apps/ttb-studio` independent; modular monolith with at most a private out-of-process audio worker; preserve raw source audio; never fake job completion or waveforms; process voices only with affirmative recording rights.

---

## Contract dependencies

- [CTR-002 Vocal reference upload API](../../../knowledge/private/contracts/CTR-002-vocal-reference-upload-api.md), revision 1, **Draft**. This PRD is blocked on acceptance for that boundary; it cannot be finalized until the user accepts the exact revision.

---

## Open questions

- [ ] Exact quota numbers and total body cap.
- [ ] Is 429 or 507 the refusal status for disk quota?
- [ ] Should a GitHub issue be opened for any small defect in this package so it gets its own IRD? (owner decision; IRDs need a real issue number)

---

## Related

- Knowledge: [architecture/vocal-reference-storage.md](../../../knowledge/private/architecture/vocal-reference-storage.md) (written in parallel by knowledge-wasp-drone)
- Knowledge: [security/trust-boundaries.md](../../../knowledge/private/security/trust-boundaries.md) (written in parallel by knowledge-wasp-drone)
- Depends on: [PRD-003](../prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md)
- Audit workspace (text, outside repo): ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47/04-remediation/roadmap.md
