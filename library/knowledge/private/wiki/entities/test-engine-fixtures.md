---
type: entity
title: "tests/conftest.py and fake_backend.py (engine test fixtures)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/tests/conftest.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-backend-base]]"
used_by:
  - "[[entities/test-engine-protocol]]"
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "module"
  - "engine"
  - "test"
related: []
sources:
  - "services/audio-engine/tests/conftest.py"
  - "services/audio-engine/tests/fake_backend.py"
---

# tests/conftest.py and fake_backend.py (engine test fixtures)

## Overview

Shared pytest fixtures and a test-only backend that writes a real sine WAV; the fake is not registered in production (`services/audio-engine/tests/conftest.py:12-31`, `services/audio-engine/tests/fake_backend.py:1`).

## Signature / Definition

```text
TOKEN = "test-token"; make_client(data, backend, max_queue=16) -> TestClient
class FakeBackend(ready=True, reason=None): id=ace-step-1.5, tasks=(text2music, repaint, cover), max_duration_seconds=20
```

## Behavior

- Client uses `device="cpu"` and base URL `http://localhost` so the Host guard passes (`services/audio-engine/tests/conftest.py:16-20`).
- `FakeBackend` uses a `gate` event to hold jobs running and a `fail` flag to raise (`services/audio-engine/tests/fake_backend.py:21-43`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/mod-engine-backend-base]]
- **used_by:** [[entities/test-engine-protocol]]
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/tests/conftest.py`
- `services/audio-engine/tests/fake_backend.py`
