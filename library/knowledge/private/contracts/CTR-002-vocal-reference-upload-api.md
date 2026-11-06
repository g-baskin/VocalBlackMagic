# CTR-002: Vocal reference upload API (SvelteKit proxy to Python)

> **Status:** Draft
> **Revision:** 1
> **Accepted by:** Pending
> **Last reviewed:** 2026-11-06
> **Supersedes:** None
> **Superseded by:** None

## Boundary and scope

The private HTTP interface between the Vocal Fix SvelteKit server (`apps/vocal-fix/src/routes/api/references/**`, `src/lib/server/backend.ts`) and the Python Vocal Fix API (`apps/vocal_fix/app.py`): create, read and delete a reference session. Excludes end-user authentication (CTR-003), storage layout (see the vocal reference storage knowledge doc) and audio processing.

## Parties and owners

| Role | Owner | PRD or component |
|---|---|---|
| Provider | python-wasp-drone | `apps/vocal_fix/app.py`, [PRD-003](../../../requirements/backlog/prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md), [PRD-006](../../../requirements/backlog/prd-006-upload-hardening/prd-006-upload-hardening-index.md) |
| Consumer | sveltekit-security-wasp-drone | `apps/vocal-fix/src/routes/api/references/+server.ts`, `[session_id]/+server.ts` |
| Identity source | auth-wasp-drone | [PRD-005](../../../requirements/backlog/prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md) |

## Sources and constraints

- Observed at 29c84e47: `apps/vocal_fix/app.py:75-80` POST takes `files`, `acknowledged_rights`, `voice_owner`; `:85-87` enforces 1 to 120 characters after trim; `:88-89` exactly five files; `:97-108` extension allowlist and 25 MiB per file; `:144-153` GET and DELETE with no auth or owner check (SEC-POLY-001, SEC-GEN-001).
- Observed: proxy `apps/vocal-fix/src/routes/api/references/+server.ts:29-30` checks only non-empty performer name (QA-VAL-002); `apps/vocal-fix/src/lib/server/backend.ts:19-24` forwards upstream body and status unchanged (SEC-SVELTE-004).
- Observed: `compose.yaml:4` binds uvicorn to 0.0.0.0 inside the container and publishes on `127.0.0.1:8001` (`:10`).
- Repo rules (constraints): preserve original raw source audio; affirmative recording-rights acknowledgement required; never expose the Python prototype publicly.

## Agreed behavior

Proposed terms (not accepted):

- Transport: private network or loopback only. Every request carries `Authorization: Bearer` with a service token read from server environment (name proposed: `VOCAL_FIX_SERVICE_TOKEN`; value never committed). Missing or wrong token returns 401 before any body parsing.
- Owner scope: every request carries `X-VBM-Tenant-Id` and `X-VBM-Subject` set by the SvelteKit server from a verified session (CTR-003), never from browser input. POST stores both in `manifest.json`; GET and DELETE return 404 (not 403) when they do not match, so session ids are not confirmed to other tenants.
- POST `/api/references` multipart: exactly 5 `files`; each 1 byte to 25 MiB; content sniffed as WAV, MP3, FLAC or M4A by magic bytes (extension alone is not enough); `acknowledged_rights` literal `true`; `voice_owner` 1 to 120 characters after trim. Total body cap 126 MiB enforced before parsing (proposed). Both sides apply the same limits; the proxy rejects first.
- Quotas: per-tenant session count and global disk quota checked before creating the session folder; exceeding returns 429 or 507 (proposed).
- Responses: 201 with `VocalReferenceSession` (`packages/contracts/src/index.ts:61-70`); GET 200 same shape; DELETE 200 `{"deleted":true,"session_id":...}` and the originals are removed.
- Errors: `{"detail": string}`. Status set 400, 401, 403 (rights not acknowledged), 404, 413, 415, 422, 429, 503, 507. For upstream 5xx the proxy returns a fixed message and logs the upstream body server-side only.
- Session id: lowercase UUID v4 string; the proxy rejects other forms with 404.

## Examples and edge cases

- Valid: five WAV files with RIFF headers, `acknowledged_rights=true`, `voice_owner=Test Performer`, valid service token and tenant headers returns 201 with five `recordings` entries, each `integrity_verified: false` until decode validation exists.
- Edge: a `.wav` file whose bytes are a PNG returns 415 and no folder remains on disk.
- Edge: GET with a valid session id owned by another tenant returns 404.
- Edge: 121-character performer name returns 422 from the proxy without contacting Python.

## Compatibility and rollout

- Native interface version: none (FastAPI auto OpenAPI not published).
- This agreement: first agreement; breaking for any caller without the token.
- Rollout: provider accepts token-optional behind a flag only on loopback during migration; the flag is removed in the same PRD (PRD-003). Existing manifests without owner fields are treated as owned by no tenant and are unreadable until migrated or deleted by an operator.

## Verification obligations

| Party | Check to run | Evidence location | State |
|---|---|---|---|
| Provider | pytest: 401 without token, 404 cross-tenant, 415 sniff mismatch, quota refusal | `tests/` (PRD-003, PRD-006) | Planned |
| Consumer | bun tests: proxy adds headers, applies limits, masks 5xx | `apps/vocal-fix/src/**/*.test.ts` (PRD-001, PRD-006) | Planned |

## PRD dependencies

| PRD or sub-PRD | Needed revision | Impact if changed |
|---|---|---|
| [PRD-003](../../../requirements/backlog/prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md) | 1 | Token and owner header names |
| [PRD-006](../../../requirements/backlog/prd-006-upload-hardening/prd-006-upload-hardening-index.md) | 1 | Limits, sniffing, error masking |
| [PRD-005](../../../requirements/backlog/prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md) | 1 | Source of tenant and subject values |

## Open decisions

- Whether a service token plus loopback binding is acceptable as the interim lock before PRD-005 lands (owner decision, PRD-003).
- Exact quota numbers (sessions per tenant, total disk) and whether quota refusal is 429 or 507.
- Header names for tenant and subject, or a signed short-lived token instead of plain headers.
- Handling of pre-existing manifests without owner fields (delete, or assign to a named operator tenant).

## Change history

| Revision | Date | Compatibility | Decision and affected parties |
|---|---|---|---|
| 1 | 2026-11-06 | Draft, first agreement | Drafted by remediation-planning-wasp-drone from the Mario audit (workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47, HEAD 29c84e47). Not accepted. |
