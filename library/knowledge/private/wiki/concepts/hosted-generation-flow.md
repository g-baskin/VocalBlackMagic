---
type: concept
title: "Hosted generation flow"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "song generation pipeline"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/dev-only-generation-gate]]"
  - "[[concepts/premium-studio]]"
sources:
  - "apps/ttb-studio/src/routes/api/generations/+server.ts"
---

# Hosted generation flow

## Definition

The path a TTB Studio song request takes from the editor through provider adapters and back as verified audio. Narrative: `library/knowledge/private/architecture/music-generation-pipeline.md`.

## How it works

- Browser validates and POSTs JSON (`apps/ttb-studio/src/routes/+page.svelte:186-211`); the route gates and validates (`apps/ttb-studio/src/routes/api/generations/+server.ts:23-46`).
- ACE-Step: optional Gemini lyrics, fal submit, 202 `fal.<id>`, browser polling, then audio via the verified stream (`apps/ttb-studio/src/routes/api/generations/+server.ts:49-91`, `apps/ttb-studio/src/routes/api/generations/[id]/audio/+server.ts:22-25`).
- Lyria: one synchronous call returning verified inline audio (`apps/ttb-studio/src/routes/api/generations/+server.ts:93-109`).
- No audio is stored server-side; Lyria results cannot be re-fetched (`apps/ttb-studio/src/routes/api/generations/[id]/+server.ts:13-17`).

## Why it matters

Every provider response passes magic-byte verification, so the app never reports success without real audio.

## Examples in this codebase

- [[entities/mod-music-fal]]
- [[entities/mod-music-lyria]]
- [[entities/mod-music-audio]]

## Connections

- **involves entities:** [[entities/route-ttb-page]], [[entities/route-ttb-post-generations]], [[entities/route-ttb-get-generation]], [[entities/route-ttb-get-generation-audio]], [[entities/mod-music-fal]], [[entities/mod-music-lyria]], [[entities/mod-music-lyricist]], [[entities/mod-music-audio]], [[entities/ext-queue-fal-run]], [[entities/ext-generativelanguage-googleapis-com]]
- **related concepts:** [[concepts/dev-only-generation-gate]], [[concepts/premium-studio]]

## Sources

- `apps/ttb-studio/src/routes/api/generations/+server.ts`
