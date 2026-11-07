---
type: question
title: "Does the engine ever return 409?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - engine
related:
  - "[[entities/mod-engine-app]]"
  - "[[concepts/engine-validation-parity]]"
---

# Does the engine ever return 409?

The protocol lists 409 among error statuses (`docs/ENGINE_PROTOCOL.md:11`), but no `EngineHTTPError(409, ...)` exists in `services/audio-engine/vbm_engine/app.py` (grep). Should the doc drop 409, or should a case such as a conflicting idempotency key return it?

## Related

- [[entities/mod-engine-app]]
- [[concepts/engine-validation-parity]]
