---
type: entity
title: "apps/ttb_studio/app.py (TTB Studio FastAPI prototype)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb_studio/app.py"
language: py
depends_on: []
used_by:
  - "[[entities/test-python-apps]]"
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
tags:
  - entity
  - module
  - ttb-studio
  - python
related:
  - "[[entities/mod-ttb-studio-backend]]"
  - "[[questions/python-ttb-generation-request-drift]]"
sources:
  - "apps/ttb_studio/app.py"
---

# apps/ttb_studio/app.py (TTB Studio FastAPI prototype)

## Overview

FastAPI scaffold whose docstring states no generative model is installed or invoked (`apps/ttb_studio/app.py:1-4`). The SvelteKit app no longer calls it for generation (see [[entities/mod-ttb-studio-backend]]).

## Signature / Definition

```py
class GenerationRequest(BaseModel)
4 route handlers
```

## Behavior

- Its own `GenerationRequest` model allows engines `ace-step`, `heartmula`, `external-v2` only and has no `duration_seconds` field (`apps/ttb_studio/app.py:19`, `apps/ttb_studio/app.py:23-32`), unlike [[entities/contract-generation-request]] (`packages/contracts/src/index.ts:10`, `packages/contracts/src/index.ts:23`).
- Endpoints: [[entities/ep-ttb-get-root]], [[entities/ep-ttb-get-health]], [[entities/ep-ttb-get-capabilities]], [[entities/ep-ttb-post-generations]] (`apps/ttb_studio/app.py:35-70`).
- > [!gap]
  > Contract drift with the TypeScript contract is tracked in [[questions/python-ttb-generation-request-drift]].

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/test-python-apps]]
- **related:** [[entities/mod-ttb-studio-backend]], [[questions/python-ttb-generation-request-drift]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb_studio/app.py`
