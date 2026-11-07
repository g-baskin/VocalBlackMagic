---
type: entity
title: "vbm_engine/audio.py (output measurement)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/vbm_engine/audio.py"
language: py
depends_on: []
used_by:
  - "[[entities/mod-engine-app]]"
  - "[[entities/mod-engine-jobs]]"
  - "[[entities/ep-engine-get-v1-jobs-job-id-audio]]"
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
sources:
  - "services/audio-engine/vbm_engine/audio.py"
---

# vbm_engine/audio.py (output measurement)

## Overview

Decodes a backend's output file with libsndfile and measures it, so the engine never trusts a backend's claimed duration (`services/audio-engine/vbm_engine/audio.py:1`, `services/audio-engine/vbm_engine/audio.py:24-35`).

## Signature / Definition

```py
CONTENT_TYPES = {wav: audio/wav, flac: audio/flac, mp3: audio/mpeg}
class AudioDecodeError(ValueError)
@dataclass(frozen=True) class AudioInfo: format, duration_seconds, sample_rate
def measure(path: Path) -> AudioInfo
```

## Behavior

- Only `wav`, `flac`, `mp3` suffixes are accepted (`services/audio-engine/vbm_engine/audio.py:10`, `services/audio-engine/vbm_engine/audio.py:26-28`).
- Raises `AudioDecodeError` when `soundfile.info` fails or the file has zero frames or sample rate (`services/audio-engine/vbm_engine/audio.py:29-34`); duration is rounded to 3 decimals (`services/audio-engine/vbm_engine/audio.py:35`).
- `CONTENT_TYPES` also sets the media type of `GET /v1/jobs/{job_id}/audio` (`services/audio-engine/vbm_engine/app.py:247-248`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/mod-engine-app]], [[entities/mod-engine-jobs]], [[entities/ep-engine-get-v1-jobs-job-id-audio]]
- **related:** [[concepts/engine-job-lifecycle]]

## Tested by

- [[entities/test-engine-protocol]]

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/vbm_engine/audio.py`
