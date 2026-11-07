---
type: question
title: "Are the legacy generation contracts in contracts index.ts still needed?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
sources:
  - "packages/contracts/src/index.ts"
---

# Are the legacy generation contracts in contracts index.ts still needed?

## Evidence

- `GenerationRequest`, `GenerationJob` and `validateGenerationRequest` are used only by `/api/generations` and the `music/` adapters (`apps/ttb-studio/src/routes/api/generations/+server.ts:4-7`), plus `apps/ttb-studio/src/lib/server/studio/create.ts:1`.
- `VocalReferenceSession`, `UploadedRecording` and `EngineCapability` have no importer in `apps/*/src`.

## Question

Should these stay as the hosted-generation API contract, or be retired in favour of the studio contracts? A human should decide; this pass did not classify them as dead.

## Related

- [[entities/contract-vocal-reference-session]]
- [[entities/contract-validate-generation-request]]
