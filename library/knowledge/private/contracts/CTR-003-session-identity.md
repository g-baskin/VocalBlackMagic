# CTR-003: Verified session and tenant identity

> **Status:** Draft
> **Revision:** 1
> **Accepted by:** Pending
> **Last reviewed:** 2026-11-06
> **Supersedes:** None
> **Superseded by:** None

## Boundary and scope

The server-side identity object every guard in both SvelteKit apps consumes (`event.locals`), the function that produces it, and the guard that rejects anything else. Shared by the auth layer (PRD-005), the generation guardrails (PRD-004) and the Python API owner checks (PRD-003, via CTR-002). Excludes the choice of identity provider, login UI and billing.

## Parties and owners

| Role | Owner | PRD or component |
|---|---|---|
| Provider | auth-wasp-drone | `packages/auth`, `apps/*/src/hooks.server.ts` (to be created), [PRD-005](../../../requirements/backlog/prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md) |
| Consumer | sveltekit-security-wasp-drone | generation routes, [PRD-004](../../../requirements/backlog/prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md) |
| Consumer | python-wasp-drone | owner checks via CTR-002, [PRD-003](../../../requirements/backlog/prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md) |

## Sources and constraints

- Observed at 29c84e47: `packages/auth/src/index.ts:5-10` defines `SaaSSession` (`subject`, `tenantId`, `emailVerified`, `roles`); `:11-15` `assertAuthenticated` accepts any object with those fields, so a forged literal passes (SEC-POLY-006).
- Observed: no `hooks.server.ts` exists in either app; routes gate only on `NODE_ENV` (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`, `apps/vocal-fix/src/routes/api/references/+server.ts:7`).
- Repo rules (constraints): two independent apps (ADR 0001, `docs/decisions/0001-independent-apps.md`); tenant-scoped access before any public exposure.

## Agreed behavior

Proposed terms (not accepted):

- Type: `VerifiedSession` is a branded type (`SaaSSession & { readonly [verified]: true }`) whose brand symbol is not exported, so only `packages/auth`'s verifier can construct it.
- Producer: `verifySession(request): Promise<VerifiedSession | null>` validates the provider token (signature, expiry, audience) and returns null on any failure. No development header or query parameter is ever accepted as identity.
- Placement: each app's `hooks.server.ts` calls the verifier once per request and sets `event.locals.session: VerifiedSession | null`.
- Guard: `requireSession(locals)` returns the session or throws a 401 response; routes that touch tenant data or paid providers call it before any other work. `assertAuthenticated` is removed or renamed `assertSessionShape` and is not used as a guard.
- Fields: `subject` stable provider user id; `tenantId` stable organization id; `emailVerified` true required; `roles` sorted, deduplicated strings.
- Ownership: any stored record (vocal session, generation job) records `tenantId` and `subject`; reads compare `tenantId` and return 404 on mismatch.

## Examples and edge cases

- Valid: a request with a valid provider cookie yields `locals.session = {subject:"user_test_1", tenantId:"org_test_1", emailVerified:true, roles:["member"]}` (branded).
- Edge: code that passes the object literal `{subject:"x",tenantId:"y",emailVerified:true,roles:[]}` to `requireSession` fails type checking and is rejected at runtime with 401.
- Edge: expired token yields `locals.session = null` and a guarded route returns 401.

## Compatibility and rollout

- Native interface version: none.
- This agreement: first agreement; breaking for `assertAuthenticated` callers (none import it at 29c84e47, see BLOAT-DEAD-002).
- Rollout: the `NODE_ENV` gates stay in place until `requireSession` is wired and tested; removing them is a separate, reviewed step.

## Verification obligations

| Party | Check to run | Evidence location | State |
|---|---|---|---|
| Provider | test: forged literal rejected; expired token rejected; valid token accepted | `packages/auth/src/*.test.ts` (PRD-005) | Planned |
| Consumer | route tests: 401 without session, 404 cross-tenant | app route tests (PRD-004, PRD-005) | Planned |

## PRD dependencies

| PRD or sub-PRD | Needed revision | Impact if changed |
|---|---|---|
| [PRD-005](../../../requirements/backlog/prd-005-authenticated-sessions-tenancy/prd-005-authenticated-sessions-tenancy-index.md) | 1 | Defines the producer |
| [PRD-004](../../../requirements/backlog/prd-004-paid-generation-guardrails/prd-004-paid-generation-guardrails-index.md) | 1 | Per-user budget keys off `subject` and `tenantId` |
| [PRD-003](../../../requirements/backlog/prd-003-python-api-service-auth/prd-003-python-api-service-auth-index.md) | 1 | Owner values forwarded over CTR-002 |

## Open decisions

- Identity provider choice (for example WorkOS, Clerk, Better Auth); this record stays provider-neutral.
- Whether `roles` is needed in the first revision or deferred.
- Whether both apps share one tenant namespace or keep separate ones (ADR 0001 keeps the apps independent).

## Change history

| Revision | Date | Compatibility | Decision and affected parties |
|---|---|---|---|
| 1 | 2026-11-06 | Draft, first agreement | Drafted by remediation-planning-wasp-drone from the Mario audit (workspace ../VocalBlackMagic-code-audit/2026-11-05-mario-29c84e47, HEAD 29c84e47). Not accepted. |
