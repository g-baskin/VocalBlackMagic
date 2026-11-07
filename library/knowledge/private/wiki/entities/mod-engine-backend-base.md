---
type: entity
title: "vbm_engine/backends/base.py (Backend protocol)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/backends/base.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/mod-engine-device]]"
  - "[[entities/mod-engine-backend-init]]"
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/mod-engine-backend-ace-step]]"
  - "[[entities/mod-engine-backend-diffrhythm]]"
  - "[[entities/mod-engine-backend-heartmula]]"
  - "[[entities/mod-engine-backend-yue2]]"
  - "[[entities/test-engine-fixtures]]"
last_commit_hash: "09057ad"
tested_by:
  - "[[entities/test-engine-protocol]]"
  - "[[entities/test-engine-backends]]"
tags:
  - "entity"
  - "module"
  - "engine"
  - "python"
related:
  - "[[concepts/engine-model-readiness]]"
  - "[[concepts/engine-job-lifecycle]]"
sources:
  - "services/audio-engine/vbm_engine/backends/base.py"
---

# vbm_engine/backends/base.py (Backend protocol)

## Overview

Plugin interface every model backend implements; heavy dependencies must be imported lazily (`services/audio-engine/vbm_engine/backends/base.py:1-5`).

## Signature / Definition

```py
class JobCancelled(Exception)
@dataclass(frozen=True) class Readiness: installed, ready, reason=None
@dataclass(frozen=True) class GenerationInput: task, prompt, lyrics, instrumental, duration_seconds, seed, source_path=None, repaint=None, extend=None, cover_strength=None, options={}
@dataclass class JobContext: work_dir, device, report, is_cancelled; checkpoint(progress, stage)
class Backend(Protocol): id, license, commercial, tasks, max_duration_seconds; readiness(device); generate(inp, ctx) -> Path
def module_available(name: str) -> bool
```

## Behavior

- `JobContext.checkpoint` raises `JobCancelled` if cancelled, else reports progress (`services/audio-engine/vbm_engine/backends/base.py:42-55`).
- `Backend.generate` returns the path of a wav/flac/mp3 file (`services/audio-engine/vbm_engine/backends/base.py:58-69`).
- `module_available` uses `importlib.util.find_spec` and treats import errors as absent (`services/audio-engine/vbm_engine/backends/base.py:72-76`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]], [[entities/mod-engine-device]], [[entities/mod-engine-backend-init]], [[entities/mod-engine-backend-common]], [[entities/mod-engine-backend-ace-step]], [[entities/mod-engine-backend-diffrhythm]], [[entities/mod-engine-backend-heartmula]], [[entities/mod-engine-backend-yue2]], [[entities/test-engine-fixtures]]
- **related:** [[concepts/engine-model-readiness]], [[concepts/engine-job-lifecycle]]

## Tested by

- [[entities/test-engine-protocol]]
- [[entities/test-engine-backends]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/backends/base.py`
