---
type: entity
title: "tests/test_backends.py (backend tests)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/tests/test_backends.py"
language: py
depends_on:
  - "[[entities/mod-engine-backend-init]]"
  - "[[entities/mod-engine-download]]"
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-backend-ace-step]]"
used_by: []
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "module"
  - "engine"
  - "test"
related:
  - "[[concepts/engine-model-readiness]]"
sources:
  - "services/audio-engine/tests/test_backends.py"
---

# tests/test_backends.py (backend tests)

## Overview

Tests for the real backends without their heavy dependencies (`services/audio-engine/tests/test_backends.py:12-99`).

## Signature / Definition

```text
pytest services/audio-engine/tests/test_backends.py
```

## Behavior

- All four models registered and honest without deps; licences (`services/audio-engine/tests/test_backends.py:12-26`).
- Download refuses when disk is short, with `VBM_ENGINE_CACHE` set via monkeypatch (`services/audio-engine/tests/test_backends.py:28-36`).
- DiffRhythm subprocess gets absolute paths and the download cache; ACE-Step readiness needs every upstream folder (`services/audio-engine/tests/test_backends.py:38-99`).
- Not run in this pass.

## Connections

- **depends_on:** [[entities/mod-engine-backend-init]], [[entities/mod-engine-download]], [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-backend-ace-step]]
- **used_by:** none found in source
- **related:** [[concepts/engine-model-readiness]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/tests/test_backends.py`
