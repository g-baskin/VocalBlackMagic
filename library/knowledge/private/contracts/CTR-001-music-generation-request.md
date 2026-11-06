# CTR-001: Music generation request and job response

> **Status:** Draft
> **Revision:** 1
> **Accepted by:** Pending
> **Last reviewed:** 2026-11-06
> **Supersedes:** None
> **Superseded by:** None

## Boundary and scope

The shape and validation rules of a song generation request (`POST /api/generations` in TTB Studio) and the job object it returns, as consumed by the TTB Studio page, the SvelteKit route, the generation guardrails (PRD-004) and the robustness work (PRD-010). Excludes provider wire formats (fal, Google Interactions), authentication (CTR-003) and spend accounting internals.

## Parties and owners

| Role | Owner | PRD or component |
|---|---|---|
| Provider | sveltekit-security-wasp-drone, then typescript-node-wasp-drone | `apps/ttb-studio/src/routes/api/generations/+server.ts`, [PRD-004](../../../requirements/backlog/prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md), [PRD-010](../../../requirements/backlog/prd-010-generation-robustness/prd-010-generation-robustness-index.md) |
| Schema owner | typescript-node-wasp-drone | `packages/contracts/src/index.ts` |
| Consumer | ux-ui-svelte-wasp-drone | `apps/ttb-studio/src/routes/+page.svelte` |
| Legacy consumer (to retire or align) | python-wasp-drone | `apps/ttb_studio/app.py`, [PRD-007](../../../requirements/backlog/prd-007-retire-legacy-python-generation/prd-007-retire-legacy-python-generation-index.md) |

## Sources and constraints

- Observed at 29c84e47: `packages/contracts/src/index.ts:10` lists engines `ace-step`, `lyria-3.5`, `heartmula`, `external-v2`; `:13-24` defines `GenerationRequest` with `duration_seconds`; `:25-26` sets 10 to 240 seconds; `:71-91` `validateGenerationRequest` trims the prompt for the minimum length.
- Observed: `apps/ttb_studio/app.py:19` lists only `ace-step`, `heartmula`, `external-v2`; `:23-32` has no `duration_seconds` and does not trim the prompt (finding QA-VAL-001).
- Observed: the route returns `{ detail }` errors with 400, 403, 415, 422, 501, 503 and provider-mapped statuses (`+server.ts:22-114`); `GenerationJob` at `index.ts:33-41`.
- Repo rule (AGENTS.md, treated as a constraint): never fake completion; an explicit 501 or 503 is preferable to false success.

## Agreed behavior

Proposed terms (not accepted):

- Authority: `packages/contracts/src/index.ts` is the single source of the request type and validator. Any other implementation either imports it or is removed.
- Request (JSON, `content-type: application/json`, else 415): `prompt` string, trimmed length 5 to 3000; `lyrics` string up to 15000 characters or null; `mode` `full-song` or `instrumental`; `engine` one of the four ids above; `sound_character` one of `raw`, `vintage`, `live`, `clean`, `custom`; `premium_studio` boolean; `texture`, `human_variation`, `mastering_intensity` integers 0 to 100; `duration_seconds` integer 10 to 240. All fields required.
- Responses: 202 with `GenerationJob` status `queued` for asynchronous engines; 200 with status `completed` only when verified audio is present; 501 for `heartmula` and `external-v2`; 503 when the engine key is not configured.
- Errors: body is always `{ "detail": string }` with a fixed, user-safe message; provider text, prompts and lyrics never appear in `detail`. Status set: 400 invalid JSON, 401 or 403 unauthenticated or gated, 402 provider credit exhausted, 413 oversize result, 415 wrong content type, 422 validation, 429 rate or spend limit (PRD-004), 501, 502 bad provider response, 503 not configured, 504 provider timeout.
- A 429 from the spend or rate guard carries a `retry_after_seconds` integer (proposed).

## Examples and edge cases

- Valid: `{"prompt":"Warm lo-fi beat with soft keys","lyrics":null,"mode":"instrumental","engine":"ace-step","sound_character":"raw","premium_studio":false,"texture":70,"human_variation":65,"mastering_intensity":25,"duration_seconds":60}` returns 202 with `{"job_id":"fal.<id>","engine":"ace-step","status":"queued"}`.
- Edge: `prompt` of four letters padded with spaces returns 422 (trimmed length below 5).
- Edge: `duration_seconds: 60.5` returns 422.
- Edge: `engine: "heartmula"` with otherwise valid body returns 501, never a fake job.

## Compatibility and rollout

- Native interface version: none (no OpenAPI file).
- This agreement: first agreement.
- Mixed-version: the legacy Python endpoint rejects `lyria-3.5` and `duration_seconds`; until PRD-007 removes or aligns it, nothing may route browser traffic to it.

## Verification obligations

| Party | Check to run | Evidence location | State |
|---|---|---|---|
| Provider | bun tests for each status above against the route with a stubbed fetch | `apps/ttb-studio/src/routes/api/generations/*.test.ts` (PRD-001) | Planned |
| Schema owner | one test per validator branch | `packages/contracts/src/index.test.ts` (PRD-001) | Planned |
| Consumer | page handles every listed status without a JSON parse error | component or e2e test (PRD-010) | Planned |

## PRD dependencies

| PRD or sub-PRD | Needed revision | Impact if changed |
|---|---|---|
| [PRD-004](../../../requirements/backlog/prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md) | 1 | 429 shape and guard order change |
| [PRD-007](../../../requirements/backlog/prd-007-retire-legacy-python-generation/prd-007-retire-legacy-python-generation-index.md) | 1 | Decides delete versus align for the Python model |
| [PRD-010](../../../requirements/backlog/prd-010-generation-robustness/prd-010-generation-robustness-index.md) | 1 | Error mapping and audio delivery |
| [PRD-001](../../../requirements/backlog/prd-001-test-safety-net/prd-001-test-safety-net-index.md) | 1 | Characterization tests encode these statuses |

## Open decisions

- Whether 200 with inline base64 audio remains allowed for Lyria or is replaced by an `audio_url` (SEC-GEN-011, PRD-010).
- Whether the 429 body carries `retry_after_seconds` or a `Retry-After` header only.
- Whether `lyrics` may be omitted or must be explicitly null.

## Change history

| Revision | Date | Compatibility | Decision and affected parties |
|---|---|---|---|
| 1 | 2026-11-06 | Draft, first agreement | Drafted by remediation-planning-wasp-drone from the Mario audit (workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47, HEAD 29c84e47). Not accepted. |
