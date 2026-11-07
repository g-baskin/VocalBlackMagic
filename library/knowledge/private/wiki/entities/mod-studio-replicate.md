---
type: entity
title: "studio/replicate.ts (Replicate HTTP client)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb-studio/src/lib/server/studio/replicate.ts"
language: ts
depends_on:
  - "[[entities/mod-music-audio]]"
  - "[[entities/mod-music-errors]]"
  - "[[entities/ext-api-replicate-com]]"
  - "[[entities/ext-replicate-delivery]]"
used_by:
  - "[[entities/mod-studio-cover]]"
  - "[[entities/mod-studio-derive]]"
  - "[[entities/mod-studio-jobs]]"
  - "[[entities/mod-studio-lyrics]]"
  - "[[entities/mod-studio-engines]]"
  - "[[entities/mod-studio-voicesummon]]"
  - "[[entities/mod-studio-runner-direct]]"
  - "[[entities/mod-studio-runner-engine]]"
  - "[[entities/mod-studio-runner-routed]]"
  - "[[entities/mod-studio-runner-models]]"
  - "[[entities/test-studio-studio]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-studio-studio]]"
tags:
  - entity
  - module
  - ttb-studio
  - studio
related:
  - "[[concepts/studio-models-and-runners]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/replicate.ts"
---

# studio/replicate.ts (Replicate HTTP client)

## Overview

Minimal Replicate API client: predictions, cancel, file upload, safe output download and capped body reads.

## Signature / Definition

```ts
export interface ReplicateDeps { token; fetch; sleep? }
export interface ReplicateModel { owner; name; version? }
export function isPredictionId(id: string): boolean
export async function replicateFailure(response, action): Promise<ProviderError>
export function parsePrediction(data: unknown): Prediction
export async function createPrediction(deps, model, input, options?): Promise<Prediction>
export async function getPrediction(deps, id): Promise<Prediction>
export async function cancelPrediction(deps, id): Promise<void>
export async function uploadFile(deps, bytes: Blob, filename: string): Promise<string>
export function isAllowedOutputUrl(raw: unknown): raw is string
export function outputText(output: unknown): string
export async function fetchOutput(fetcher, url): Promise<Response>
export function isOutputRef(raw: unknown): raw is string
export async function outputResponse(fetcher, ref): Promise<Response>
export async function readCapped(response, maxBytes): Promise<Uint8Array>
```

## Behavior

- Base URL is `https://api.replicate.com/v1`; prediction ids must match `[a-z0-9]{10,64}` (`apps/ttb-studio/src/lib/server/studio/replicate.ts:4-5`).
- The token travels only as a Bearer header (`apps/ttb-studio/src/lib/server/studio/replicate.ts:35-37`); failures map 401/403 to 502, 402, 429, 400/422 to 422, 404, else 502, keeping a 300-character body excerpt as log detail (`apps/ttb-studio/src/lib/server/studio/replicate.ts:39-62`).
- `createPrediction` uses `/predictions` with a pinned version or the model endpoint for official models, sends `prefer: wait=N` when asked, and retries a 429 up to four times after `retry_after` (refusing waits over 15 s) because a throttled create did not run (`apps/ttb-studio/src/lib/server/studio/replicate.ts:94-127`).
- `cancelPrediction` ignores 404 and 409 (`apps/ttb-studio/src/lib/server/studio/replicate.ts:139-149`); `uploadFile` posts multipart to `/files` with a 120 s timeout and requires a `/v1/files/` URL back (`apps/ttb-studio/src/lib/server/studio/replicate.ts:152-175`).
- `isAllowedOutputUrl` accepts only plain https on `replicate.delivery` or the `ai-gateway-outputs.<32 hex>.r2.cloudflarestorage.com` bucket (`apps/ttb-studio/src/lib/server/studio/replicate.ts:178-191`).
- `fetchOutput` downloads without the token, follows at most four manual redirects and re-checks each hop (`apps/ttb-studio/src/lib/server/studio/replicate.ts:206-229`); `outputResponse` decodes inline base64 audio after `inspectBase64Audio` (`apps/ttb-studio/src/lib/server/studio/replicate.ts:238-244`).
- `readCapped` refuses a declared or streamed body over `maxBytes` with 502 (`apps/ttb-studio/src/lib/server/studio/replicate.ts:247-274`).

## Connections

- **depends_on:** [[entities/mod-music-audio]], [[entities/mod-music-errors]], [[entities/ext-api-replicate-com]], [[entities/ext-replicate-delivery]]
- **used_by:** [[entities/mod-studio-cover]], [[entities/mod-studio-derive]], [[entities/mod-studio-jobs]], [[entities/mod-studio-lyrics]], [[entities/mod-studio-engines]], [[entities/mod-studio-voicesummon]], [[entities/mod-studio-runner-direct]], [[entities/mod-studio-runner-engine]], [[entities/mod-studio-runner-routed]], [[entities/mod-studio-runner-models]], [[entities/test-studio-studio]]
- **related:** [[concepts/studio-models-and-runners]]

## Tested by

- [[entities/test-studio-studio]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `apps/ttb-studio/src/lib/server/studio/replicate.ts`
