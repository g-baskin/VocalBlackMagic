---
type: entity
title: "vbm_engine/__init__.py (protocol version)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/__init__.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-app]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "services/audio-engine/vbm_engine/__init__.py"
---

# vbm_engine/__init__.py (protocol version)

## Overview

Package marker declaring the engine protocol and package version (`services/audio-engine/vbm_engine/__init__.py:1-4`).

## Signature / Definition

```py
PROTOCOL_VERSION = 1
__version__ = "0.1.0"
```

## Behavior

- `PROTOCOL_VERSION = 1` (`services/audio-engine/vbm_engine/__init__.py:3`) is reported by `GET /v1/health` (`services/audio-engine/vbm_engine/app.py:167`).
- `__version__ = "0.1.0"` (`services/audio-engine/vbm_engine/__init__.py:4`) is the FastAPI app version and the health `version` field (`services/audio-engine/vbm_engine/app.py:106`, `services/audio-engine/vbm_engine/app.py:168`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-app]]
- **related:** [[concepts/engine-deployment-targets]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/__init__.py`
