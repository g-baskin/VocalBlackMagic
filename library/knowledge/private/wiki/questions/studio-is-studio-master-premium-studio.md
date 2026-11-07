---
type: question
title: "Is Studio Master the Premium Studio processing step?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - studio
related:
  - "[[concepts/premium-studio]]"
  - "[[entities/mod-studio-master]]"
  - "[[entities/mod-studio-derive]]"
sources:
  - "apps/ttb-studio/src/lib/server/studio/derive.ts"
  - "docs/GLOSSARY.md"
---

# Is Studio Master the Premium Studio processing step?

## Question

`docs/GLOSSARY.md:17` defines Premium Studio as optional finishing on a derived copy with processing planned. Studio Master (`apps/ttb-studio/src/lib/server/studio/derive.ts:173-204`) now does local non-destructive mastering to a new child song, but nothing reads `premium_studio`, and the studio hardcodes it false (`apps/ttb-studio/src/lib/server/studio/create.ts:89`). Is Studio Master the intended implementation, a separate feature, or a precursor?

## Why it matters

If it is the implementation, the glossary status, capability `processing_ready: false` (`apps/ttb-studio/src/lib/server/music/capabilities.ts:34`) and the editor toggle are stale. If not, two overlapping finishing concepts need distinct names.

## Evidence so far

- No commit message in #8 to #10 links them; this was not inferred as an ADR.

## Resolution

Pending human confirmation.
