---
type: concept
title: "Engine validation parity"
complexity: intermediate
domain: "vocal-black-magic"
aliases: []
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - concept
  - engine
related:
  - "[[entities/mod-engine-validation]]"
  - "[[entities/mod-contracts-engine]]"
  - "[[entities/test-engine-validation-parity]]"
sources:
  - "services/audio-engine/vbm_engine/validation.py"
  - "docs/ENGINE_PROTOCOL.md"
---

# Engine validation parity

## Definition

The engine request validator exists twice, in TypeScript and Python, and must give identical messages.

## How it works

- Python mirror declares the rule (`services/audio-engine/vbm_engine/validation.py:1-7`).
- A shared fixture in `packages/contracts/fixtures/engine-requests.json` is run by the Python suite (`services/audio-engine/tests/test_validation_parity.py:11-22`).
- The protocol doc says to change both and bump the protocol number (`docs/ENGINE_PROTOCOL.md:3`).

## Related

- [[entities/mod-engine-validation]]
- [[entities/mod-contracts-engine]]
- [[entities/test-engine-validation-parity]]
