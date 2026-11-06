---
type: entity
title: "ttb_studio POST /api/generations"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/ttb_studio/app.py"
language: py
depends_on:
  - "[[entities/mod-ttb-studio-python-app]]"
used_by: []
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
route_method: POST
route_path: "/api/generations"
tags:
  - entity
  - function
  - ttb-studio
  - python-endpoint
related:
  - "[[questions/python-ttb-generation-request-drift]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb_studio/app.py"
---

# ttb_studio POST /api/generations

## Overview

Validates then refuses generation (`apps/ttb_studio/app.py:64-70`).

## Signature / Definition

```py
@app.post("/api/generations")
```

## Behavior

- Pydantic validates the body (`apps/ttb_studio/app.py:23-32`); the handler always raises 503 stating no engine is configured, never returning fake audio (`apps/ttb_studio/app.py:66-70`).
- No SvelteKit route proxies to it at 29c84e47.

## Connections

- **depends_on:** [[entities/mod-ttb-studio-python-app]]
- **used_by:** no importer or caller found in source
- **related:** [[questions/python-ttb-generation-request-drift]], [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb_studio/app.py`
