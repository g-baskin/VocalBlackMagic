---
type: question
title: "Should POST /api/studio/seances/{id}/rank call validateSeanceRanking?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
sources:
  - "packages/contracts/src/studio.ts"
---

# Should POST /api/studio/seances/{id}/rank call validateSeanceRanking?

## Evidence

- `validateSeanceRanking` is defined at `packages/contracts/src/studio.ts:335-343` with a doc comment naming the rank route.
- The rank route imports only `SeanceLabel` (`apps/ttb-studio/src/routes/api/studio/seances/[id]/rank/+server.ts:1`); grep finds no caller in `apps/`.

## Question

Does the server validate ranking another way (for example in `apps/ttb-studio/src/lib/server/studio/seance.ts`), or is the shared validator unused? Not verified in this unit.

## Related

- [[entities/contract-validate-seance-request]]
