---
type: question
title: "Should GET /v1/health stay public on public deployments?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - engine
related:
  - "[[entities/ep-engine-get-v1-health]]"
  - "[[concepts/engine-deployment-targets]]"
---

# Should GET /v1/health stay public on public deployments?

Health needs no token (`services/audio-engine/vbm_engine/app.py:161-174`, `docs/ENGINE_PROTOCOL.md:8`) and returns device, queue counts and model readiness. On Modal or Docker the Host guard is off (`services/audio-engine/modal_app.py:112`, `services/audio-engine/Dockerfile:55`), so anyone with the URL can read this. Is that acceptable?

## Related

- [[entities/ep-engine-get-v1-health]]
- [[concepts/engine-deployment-targets]]
