---
type: question
title: "Python ttb_studio GenerationRequest drift"
question: "Should the Python ttb_studio GenerationRequest track the TypeScript contract (lyria-3.5, duration_seconds) or be retired?"
answer_quality: draft
created: "2026-11-06"
updated: "2026-11-06"
status: seed
tags:
  - question
related:
  - "[[entities/mod-ttb-studio-python-app]]"
  - "[[entities/contract-generation-request]]"
  - "[[entities/ep-ttb-post-generations]]"
sources: []
---

# Python ttb_studio GenerationRequest drift

## Question

Should the Python ttb_studio GenerationRequest track the TypeScript contract (lyria-3.5, duration_seconds) or be retired?

## Evidence

- Python engines: `ace-step`, `heartmula`, `external-v2` (`apps/ttb_studio/app.py:19`); no `duration_seconds` (`apps/ttb_studio/app.py:23-32`).
- TypeScript adds `lyria-3.5` and `duration_seconds` (`packages/contracts/src/index.ts:10`, `packages/contracts/src/index.ts:23`).

## Needs

A human owner to confirm intent. Nothing here is a decision.
