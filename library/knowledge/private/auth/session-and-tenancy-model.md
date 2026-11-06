# Session and Tenancy Model

> Category: Auth | Version: 1.0 | Date: November 2026 | Status: Active

For anyone planning authentication, tenancy or billing: what `packages/auth`, `packages/database` and `packages/billing` contain on commit 29c84e47, what they do not do, and where they are and are not imported. In short: they are type contracts, and no runtime code uses them.

**Related:**
- [`../security/trust-boundaries.md`](../security/trust-boundaries.md)
- [`../architecture/vocal-reference-storage.md`](../architecture/vocal-reference-storage.md)
- [`../architecture/music-generation-pipeline.md`](../architecture/music-generation-pipeline.md)
- [`../../../../docs/decisions/0003-runtime-boundary.md`](../../../../docs/decisions/0003-runtime-boundary.md)

---

## Why these packages exist

The packages reserve names and shapes for a future SaaS layer so that both apps can depend on one definition. Each source file states its own limit: auth is an "Authorization contract only" with no identity provider (`packages/auth/src/index.ts:1-4`), database holds "Future persistence contracts" with no connection (`packages/database/src/index.ts:1`), and billing holds "Planning interfaces only" with no payments or balances (`packages/billing/src/index.ts:1`). Because nothing enforces identity, the apps rely on the development-only gates described in [`trust-boundaries.md`](../security/trust-boundaries.md).

## packages/auth

The package exports its TypeScript source directly (`packages/auth/package.json:6-8`). It defines:

```ts
// packages/auth/src/index.ts:5-15
export interface SaaSSession {
  subject: string;
  tenantId: string;
  emailVerified: boolean;
  roles: readonly string[];
}
export function assertAuthenticated(session: SaaSSession | null): asserts session is SaaSSession
```

`assertAuthenticated` throws unless the supplied object is non-null with a non-empty `subject` and `tenantId` and `emailVerified` true (`packages/auth/src/index.ts:11-15`). It checks only the object it is handed. Nothing creates, signs, stores or verifies a session, and `roles` is never inspected (`packages/auth/src/index.ts:11-15`).

## packages/database

Two record interfaces, no client (`packages/database/src/index.ts:1-15`):

| Interface | Fields |
|---|---|
| `ProjectRecord` | `id`, `tenantId`, `product` (`vocal-fix` or `ttb-studio`), `createdAt` (`packages/database/src/index.ts:2-7`) |
| `AudioAssetRecord` | `id`, `tenantId`, `projectId`, `storageKey`, `sha256`, `ownerConsentId: string \| null` (`packages/database/src/index.ts:8-15`) |

There is no schema, migration or connection string. `DATABASE_URL` appears only as a commented placeholder (`.env.example:13-14`). Vocal Fix today stores recordings as files with a JSON manifest and no tenant or hash fields (`apps/vocal_fix/app.py:112-131`), so `AudioAssetRecord` describes a target, not the current store.

## packages/billing

Two interfaces (`packages/billing/src/index.ts:2-17`): `CreditLedgerEntry` with `tenantId`, `product`, `delta`, `reason`, `idempotencyKey` and `createdAt` (`billing/src/index.ts:3-11`), and `SubscriptionEntitlement` with `tenantId`, `planId`, `active` and `monthlyCredits` (`billing/src/index.ts:12-17`). No payment provider is integrated; Stripe variables are commented placeholders (`.env.example:16-17`). Hosted generation costs are therefore uncapped by code, which is why `gate.ts` keeps generation development-only (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`).

## Where they are and are not imported

Both apps declare all three as workspace dependencies (`apps/vocal-fix/package.json:15-17`, `apps/ttb-studio/package.json:15-17`). A repository search of `apps` and `packages` TypeScript and Svelte files for `@vbm/` found imports only of `@vbm/contracts` and `@vbm/ui` (for example `apps/ttb-studio/src/routes/api/generations/+server.ts:3-7`, `apps/vocal-fix/src/routes/+page.svelte:3-5`). No file imports `@vbm/auth`, `@vbm/database` or `@vbm/billing`, and no test covers them (the `bun test` path includes `packages`, but the only package test is `packages/contracts/src/index.test.ts`). The Python APIs have no equivalent model of users or tenants (`apps/vocal_fix/app.py:75-80` accepts files, a rights flag and a performer name only).

## What this means in practice

There is no tenant isolation. A Vocal Fix session id is the only key to a recording set (`apps/vocal_fix/app.py:144-153`), and a fal job id is the only key to a generated song (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:12-19`). Replacing the dev gates requires a real identity provider, a verified session per request, a tenant id on every stored record and ownership checks on every id lookup; none of these exist on this ref.
