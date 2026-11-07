---
type: question
title: "Retire the legacy /api/generations routes?"
question: "Should the /api/generations and /api/capabilities routes be removed now that the UI uses /api/studio/*?"
answer_quality: draft
created: "2026-11-06"
updated: "2026-11-06"
status: seed
tags:
  - question
related:
  - "[[concepts/ttb-legacy-generation-api]]"
  - "[[entities/route-ttb-post-generations]]"
  - "[[entities/route-ttb-get-capabilities]]"
sources: []
---

# Retire the legacy /api/generations routes?

## Question

Should the /api/generations and /api/capabilities routes be removed now that the UI uses /api/studio/*?

## Evidence

- No browser caller in `apps/ttb-studio/src`; the only other reference is a test request URL (`apps/ttb-studio/src/lib/server/music/music.test.ts:311`).
- The routes skip the studio localhost guard (`apps/ttb-studio/src/lib/server/studio/context.ts:51-60`) yet can spend on fal and Gemini in development (`apps/ttb-studio/src/routes/api/generations/+server.ts:49-109`).
- External scripts or docs might still call them; not checked.

## Needs

A human owner to decide; filed from Phase 6 because the caller change is a semantic shift with unclear intent.
