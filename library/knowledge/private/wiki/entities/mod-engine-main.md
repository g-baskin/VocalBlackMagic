---
type: entity
title: "vbm_engine/__main__.py (engine launcher)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/__main__.py"
language: py
depends_on:
  - "[[entities/mod-engine-app]]"
  - "[[entities/env-vbm-engine-token]]"
used_by: []
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
  - "services/audio-engine/vbm_engine/__main__.py"
---

# vbm_engine/__main__.py (engine launcher)

## Overview

CLI entry point `python -m vbm_engine [--host] [--port]` that refuses to start without a token and decides whether the localhost Host guard applies (`services/audio-engine/vbm_engine/__main__.py:1`, `services/audio-engine/vbm_engine/__main__.py:22-40`).

## Signature / Definition

```py
def is_local_host(host: str) -> bool
def main(argv: list[str] | None = None) -> int
```

## Behavior

- Defaults: host `127.0.0.1`, port `8090` (`services/audio-engine/vbm_engine/__main__.py:24-25`).
- Returns exit code 2 with a stderr message when `VBM_ENGINE_TOKEN` is empty, on any address (`services/audio-engine/vbm_engine/__main__.py:30-35`).
- `local_bind` is true only for `localhost` or a loopback IP literal (`services/audio-engine/vbm_engine/__main__.py:13-19`, `services/audio-engine/vbm_engine/__main__.py:36`); binding `0.0.0.0` therefore turns the Host guard off.
- Runs `uvicorn.run(create_app(settings), ...)` (`services/audio-engine/vbm_engine/__main__.py:37-39`).

## Connections

- **depends_on:** [[entities/mod-engine-app]], [[entities/env-vbm-engine-token]]
- **used_by:** none found in source
- **related:** [[concepts/engine-deployment-targets]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/__main__.py`
