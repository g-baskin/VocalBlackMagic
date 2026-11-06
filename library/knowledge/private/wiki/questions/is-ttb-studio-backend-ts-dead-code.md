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

- The module exports a Python bridge (`apps/ttb-studio/src/lib/server/backend.ts:2-24`).
- The code graph has no edge to or from it; generation calls providers directly (`apps/ttb-studio/src/routes/api/generations/+server.ts:9-17`).

## Needs

A human owner to confirm intent. Nothing here is a decision.
