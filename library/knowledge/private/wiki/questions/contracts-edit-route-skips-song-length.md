---
type: question
title: "Should the edit route pass the song length to validateEditRequest?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
sources:
  - "packages/contracts/src/studio.ts"
  - "apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts"
---

# Should the edit route pass the song length to validateEditRequest?

## Evidence

- `validateEditRequest` only checks that a repaint ends inside the song when `songSeconds` is not null (`packages/contracts/src/studio.ts:403-404`).
- The route passes `null` (`apps/ttb-studio/src/routes/api/studio/songs/[id]/edit/+server.ts:31`).

## Question

Is the bound enforced later (for example in `apps/ttb-studio/src/lib/server/studio/edit.ts`), or can a repaint past the end reach a runner? Not verified in this unit.

## Related

- [[entities/contract-validate-edit-request]]
