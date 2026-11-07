---
type: concept
title: "Engine model readiness"
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
  - "[[entities/mod-engine-backend-common]]"
  - "[[entities/ep-engine-get-v1-health]]"
  - "[[entities/env-vbm-engine-allow-cpu]]"
  - "[[entities/env-vbm-engine-device]]"
sources:
  - "services/audio-engine/vbm_engine/backends/common.py"
---

# Engine model readiness

## Definition

Health reports a model ready only when dependencies, weights and hardware all allow a run now.

## How it works

- `installed` needs Python modules and weights; `ready` additionally needs enough GPU memory or the CPU opt-in (`services/audio-engine/vbm_engine/backends/common.py:15-41`).
- Thresholds: ACE-Step 12 GB, DiffRhythm 2 12 GB, HeartMuLa 16 GB, YuE2 24 GB CUDA only (`services/audio-engine/vbm_engine/backends/ace_step.py:39`, `services/audio-engine/vbm_engine/backends/diffrhythm.py:29`, `services/audio-engine/vbm_engine/backends/heartmula.py:28`, `services/audio-engine/vbm_engine/backends/yue2.py:26`).
- Jobs for unready models are refused with 503 (`services/audio-engine/vbm_engine/app.py:206-208`).
- Licence and `commercial` flags travel in health; YuE2 is non-commercial (`services/audio-engine/vbm_engine/backends/yue2.py:31-32`).

## Related

- [[entities/mod-engine-backend-common]]
- [[entities/ep-engine-get-v1-health]]
- [[entities/env-vbm-engine-allow-cpu]]
- [[entities/env-vbm-engine-device]]
