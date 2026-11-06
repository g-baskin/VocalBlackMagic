---
type: concept
title: "Gold Vocal"
complexity: intermediate
domain: "vocal-black-magic"
aliases:
  - "GoldVocal"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
related:
  - "[[concepts/reference-session]]"
sources:
  - "apps/vocal_fix/app.py"
  - "docs/GLOSSARY.md"
  - "docs/PRODUCT_SPEC.md"
---

# Gold Vocal

## Definition

Planned curated set of clean representative vocal segments with source provenance; never waveform averaging or an automatic identity clone (`docs/GLOSSARY.md:14`, `docs/PRODUCT_SPEC.md:10`).

## How it works

- Not implemented: the process endpoint always returns 501 (`apps/vocal_fix/app.py:156-162`) and capabilities report `gold_vocal: not-implemented` (`apps/vocal_fix/app.py:69`).
- Manifests carry `gold_vocal_ready: False` (`apps/vocal_fix/app.py:128`).

## Why it matters

Any UI or doc claiming a Gold Vocal exists would be false at 29c84e47.

## Examples in this codebase

- [[entities/ep-vf-post-process]]
- [[entities/route-vf-page]] tells the user it is upcoming

## Connections

- **involves entities:** [[entities/ep-vf-post-process]], [[entities/ep-vf-get-capabilities]], [[entities/contract-vocal-reference-session]]
- **related concepts:** [[concepts/reference-session]]

## Sources

- `apps/vocal_fix/app.py`
- `docs/GLOSSARY.md`
- `docs/PRODUCT_SPEC.md`
