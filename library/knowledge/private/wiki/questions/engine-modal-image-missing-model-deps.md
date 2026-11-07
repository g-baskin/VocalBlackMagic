---
type: question
title: "Can DiffRhythm 2 or YuE2 ever be ready on Modal?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - engine
related:
  - "[[entities/mod-engine-modal-app]]"
  - "[[concepts/engine-model-readiness]]"
---

# Can DiffRhythm 2 or YuE2 ever be ready on Modal?

For these backends the Modal image installs only torch (`services/audio-engine/modal_app.py:75-78`). The YuE2 wheel and DiffRhythm requirements must be pip installed after download (`services/audio-engine/requirements-yue2.txt:3-4`, `services/audio-engine/requirements-diffrhythm2.txt:2-3`), but the Modal `download` function does not install anything (`services/audio-engine/modal_app.py:115-122`). Readiness checks would then report deps missing (`services/audio-engine/vbm_engine/backends/yue2.py:41-50`). Not run; needs confirmation.

## Related

- [[entities/mod-engine-modal-app]]
- [[concepts/engine-model-readiness]]
