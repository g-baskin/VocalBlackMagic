---
type: entity
title: "tests/test_protocol.py (engine protocol tests)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/tests/test_protocol.py"
language: py
depends_on:
  - "[[entities/test-engine-fixtures]]"
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
used_by: []
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "module"
  - "engine"
  - "test"
related:
  - "[[concepts/engine-job-lifecycle]]"
sources:
  - "services/audio-engine/tests/test_protocol.py"
---

# tests/test_protocol.py (engine protocol tests)

## Overview

pytest suite driving the FastAPI app with the fake backend through `TestClient` (`services/audio-engine/tests/test_protocol.py:39-224`).

## Signature / Definition

```text
pytest services/audio-engine/tests/test_protocol.py
```

## Behavior

- Health is public and honest; not-ready and dependency-less backends report it (`services/audio-engine/tests/test_protocol.py:39-58`).
- Auth required; refuses to start without a token; Host guard on locally and off for public binds (`services/audio-engine/tests/test_protocol.py:60-88`).
- Measured audio, duration clamp, validation and unsupported task, source limits (`services/audio-engine/tests/test_protocol.py:90-136`).
- Idempotency, cancel queued/running, cancel during measurement never overwritten, failure has no output, queue full, restart recovery (`services/audio-engine/tests/test_protocol.py:138-224`).
- Not run in this pass (read-only documentation).

## Connections

- **depends_on:** [[entities/test-engine-fixtures]], [[entities/mod-engine-app]], [[entities/mod-engine-jobs]]
- **used_by:** none found in source
- **related:** [[concepts/engine-job-lifecycle]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/tests/test_protocol.py`
