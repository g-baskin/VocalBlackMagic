# Session and Tenancy Model

> Category: Auth | Version: 1.1 | Date: November 2026 | Status: Active

For anyone planning authentication, tenancy or billing: what `packages/auth`, `packages/database` and `packages/billing` contain (written at 29c84e47, rechecked at b58d4574: the packages are unchanged), what they do not do, and where they are and are not imported. In short: they are type contracts, and no runtime code uses them.

**Related:**
- [`../security/trust-boundaries.md`](../security/trust-boundaries.md)
- [`../architecture/vocal-reference-storage.md`](../architecture/vocal-reference-storage.md)
- [`../architecture/music-generation-pipeline.md`](../architecture/music-generation-pipeline.md)
- [`../architecture/song-studio.md`](../architecture/song-studio.md)
- [`../architecture/vocal-fix-pipeline.md`](../architecture/vocal-fix-pipeline.md)
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

There is no schema, migration or connection string. `DATABASE_URL` appears only as a commented placeholder (`.env.example:13-14`). The legacy Python Vocal Fix stores recordings with no tenant or hash fields (`apps/vocal_fix/app.py:112-131`). The SvelteKit Vocal Fix now records a `sha256` per recording, but it still has no tenant or project id (`apps/vocal-fix/src/lib/server/storage.ts:53-65`). TTB songs are `meta.json` files with no owner field (`packages/contracts/src/studio.ts:70-97`). `AudioAssetRecord` therefore describes a target, not the current store.

## packages/billing

Two interfaces (`packages/billing/src/index.ts:2-17`): `CreditLedgerEntry` with `tenantId`, `product`, `delta`, `reason`, `idempotencyKey` and `createdAt` (`billing/src/index.ts:3-11`), and `SubscriptionEntitlement` with `tenantId`, `planId`, `active` and `monthlyCredits` (`billing/src/index.ts:12-17`). No payment provider is integrated; Stripe variables are commented placeholders (`.env.example:16-17`). Hosted costs are therefore not capped by any budget. The only limits are local running-job caps (`apps/ttb-studio/src/lib/server/studio/jobs.ts:150-182`, `apps/vocal-fix/src/lib/server/jobs.ts:44-54`), which is why both apps stay development-only (`apps/ttb-studio/src/lib/server/music/gate.ts:1-4`, `apps/vocal-fix/src/lib/server/gate.ts:1-12`).

## Where they are and are not imported

Both apps declare all three as workspace dependencies (`apps/vocal-fix/package.json:15-17`, `apps/ttb-studio/package.json:15-17`). A repository search of `apps` and `packages` TypeScript and Svelte files for `@vbm/` found imports only of `@vbm/contracts` and `@vbm/ui` (for example `apps/ttb-studio/src/routes/api/generations/+server.ts:3-7`, `apps/vocal-fix/src/routes/+page.svelte:3-5`). No file imports `@vbm/auth`, `@vbm/database` or `@vbm/billing`, and no test covers them (the `bun test` path includes `packages`, but the only package test is `packages/contracts/src/index.test.ts`). The Python APIs have no equivalent model of users or tenants (`apps/vocal_fix/app.py:75-80` accepts files, a rights flag and a performer name only).

## Consent records are not identity

The voice registry's `VoiceConsent` (`own_voice`, `attested_name`, `statement`, `attested_at`, `session_id`) is checked for shape by `isVoiceModel` (`packages/contracts/src/voice.ts:4-50`). Vocal Fix requires the typed name to match the session performer (`apps/vocal-fix/src/lib/server/forge.ts:18-31`). Nothing ties either name to an authenticated account, and `ownerConsentId` in `packages/database` is still unused.

## What this means in practice

There is no tenant isolation. A session id is the only key to a recording set (`apps/vocal-fix/src/lib/server/storage.ts:80-85`; legacy `apps/vocal_fix/app.py:144-153`). A song, job or séance id is the only key to studio data (`apps/ttb-studio/src/lib/server/studio/library.ts:17-19`). Any local caller can list every song (`GET /api/studio/songs`) and every usable voice (`GET /api/studio/voices`). The localhost Host guards limit *where* requests come from, not *who* sends them. Replacing the dev gates requires a real identity provider, a verified session per request, a tenant id on every stored record and ownership checks on every id lookup; none of these exist on this ref.
