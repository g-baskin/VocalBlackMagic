---
type: question
title: "Is ttb-studio backend.ts dead code?"
question: "Should apps/ttb-studio/src/lib/server/backend.ts be kept, given nothing imports it?"
answer_quality: draft
created: "2026-11-06"
updated: "2026-11-06"
status: seed
tags:
  - question
related:
  - "[[entities/mod-ttb-studio-backend]]"
  - "[[entities/env-ttb-studio-api-url]]"
sources: []
---

# Is ttb-studio backend.ts dead code?

## Question

Should apps/ttb-studio/src/lib/server/backend.ts be kept, given nothing imports it?

## Evidence

- The module exports a Python bridge (`apps/ttb-studio/src/lib/server/backend.ts:2-24`), unchanged since `3997ab2`.
- At HEAD `b58d457` a search of `apps/ttb-studio/src` for `server/backend` finds no importer; generation and the new studio routes call providers through studio modules instead (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:10`).
- Evidence that it is unreferenced is stronger; whether it should be kept is still an intent question, so this stays unanswered.

## Needs

A human owner to confirm intent. Nothing here is a decision.
