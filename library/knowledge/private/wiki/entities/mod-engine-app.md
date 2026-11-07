---
type: entity
title: "vbm_engine/app.py (FastAPI protocol v1 app)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/app.py"
language: py
depends_on:
  - "[[entities/mod-engine-init]]"
  - "[[entities/mod-engine-audio]]"
  - "[[entities/mod-engine-backend-base]]"
  - "[[entities/mod-engine-backend-init]]"
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/mod-engine-validation]]"
  - "[[entities/mod-engine-device]]"
  - "[[entities/env-vbm-engine-token]]"
  - "[[entities/env-vbm-engine-data]]"
  - "[[entities/env-vbm-engine-cache]]"
  - "[[entities/env-vbm-engine-concurrency]]"
  - "[[entities/env-vbm-engine-max-queue]]"
used_by:
  - "[[entities/mod-engine-main]]"
  - "[[entities/mod-engine-download]]"
  - "[[entities/mod-engine-modal-app]]"
  - "[[entities/test-engine-fixtures]]"
  - "[[entities/ep-engine-get-v1-health]]"
  - "[[entities/ep-engine-post-v1-jobs]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id-audio]]"
  - "[[entities/ep-engine-delete-v1-jobs-job-id]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-job-lifecycle]]"
  - "[[concepts/engine-model-readiness]]"
  - "[[concepts/engine-deployment-targets]]"
sources:
  - "services/audio-engine/vbm_engine/app.py"
  - "docs/ENGINE_PROTOCOL.md"
---

# vbm_engine/app.py (FastAPI protocol v1 app)

## Overview

FastAPI application implementing the five protocol v1 routes, bearer auth, the localhost Host guard, request limits and the uniform `{detail, code}` error shape (`services/audio-engine/vbm_engine/app.py:1`, `services/audio-engine/vbm_engine/app.py:84-259`).

## Signature / Definition

```py
@dataclass(frozen=True) class Settings: token, data_dir, cache_dir, concurrency=1, max_queue=16, device=None, local_bind=True
  @classmethod from_env() -> Settings
def host_allowed(host: str) -> bool
class EngineHTTPError(Exception)
def create_app(settings: Settings, backends: Mapping[str, Backend] | None = None) -> FastAPI
def _to_input(body, backend) -> GenerationInput
```

## Behavior

- `Settings.from_env` reads `VBM_ENGINE_TOKEN`, `VBM_ENGINE_DATA`, `VBM_ENGINE_CACHE`, `VBM_ENGINE_CONCURRENCY`, `VBM_ENGINE_MAX_QUEUE` (`services/audio-engine/vbm_engine/app.py:46-54`); `device` and `local_bind` are not env-driven here (`services/audio-engine/vbm_engine/app.py:42-44`).
- `create_app` raises `ValueError` when the token is empty (`services/audio-engine/vbm_engine/app.py:104-105`); backends default to the production registry (`services/audio-engine/vbm_engine/app.py:87-90`) and the device to `detect_device()` (`services/audio-engine/vbm_engine/app.py:91`).
- A `JobManager` is created in the lifespan and shut down on exit (`services/audio-engine/vbm_engine/app.py:94-102`).
- Host guard middleware returns 403 `unauthorized` for a non-loopback Host when `local_bind` (`services/audio-engine/vbm_engine/app.py:57`, `services/audio-engine/vbm_engine/app.py:61-72`, `services/audio-engine/vbm_engine/app.py:108-114`).
- Error handlers map 404/405 to `not_found`, other HTTP errors to `invalid_request`, schema errors to 422, and any other exception to 500 `internal` without detail (`services/audio-engine/vbm_engine/app.py:116-131`).
- Auth: `Authorization: Bearer` compared with `hmac.compare_digest` (`services/audio-engine/vbm_engine/app.py:137-144`); job ids must match `^[A-Za-z0-9_-]{1,80}$` or answer 404 (`services/audio-engine/vbm_engine/app.py:58`, `services/audio-engine/vbm_engine/app.py:133-135`).
- Limits: source audio 50 MiB decoded, request body about base64(50 MiB) plus 1 MiB (`services/audio-engine/vbm_engine/app.py:29-31`).
- `_to_input` clamps duration to the backend maximum (default 30 s), draws a `SystemRandom` seed when none is given, treats empty lyrics as instrumental, and keeps only scalar `options` (`services/audio-engine/vbm_engine/app.py:262-296`).

## Connections

- **depends_on:** [[entities/mod-engine-init]], [[entities/mod-engine-audio]], [[entities/mod-engine-backend-base]], [[entities/mod-engine-backend-init]], [[entities/mod-engine-jobs]], [[entities/mod-engine-validation]], [[entities/mod-engine-device]], [[entities/env-vbm-engine-token]], [[entities/env-vbm-engine-data]], [[entities/env-vbm-engine-cache]], [[entities/env-vbm-engine-concurrency]], [[entities/env-vbm-engine-max-queue]]
- **used_by:** [[entities/mod-engine-main]], [[entities/mod-engine-download]], [[entities/mod-engine-modal-app]], [[entities/test-engine-fixtures]], [[entities/ep-engine-get-v1-health]], [[entities/ep-engine-post-v1-jobs]], [[entities/ep-engine-get-v1-jobs-job-id]], [[entities/ep-engine-get-v1-jobs-job-id-audio]], [[entities/ep-engine-delete-v1-jobs-job-id]]
- **related:** [[concepts/engine-job-lifecycle]], [[concepts/engine-model-readiness]], [[concepts/engine-deployment-targets]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/app.py`
- `docs/ENGINE_PROTOCOL.md`
