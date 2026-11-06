---
type: entity
title: "ttb_studio GET /api/capabilities"
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
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - ttb-studio
  - python-endpoint
related:
  - "[[concepts/premium-studio]]"
  - "[[codegraph]]"
sources:
  - "apps/ttb_studio/app.py"
---

# ttb_studio GET /api/capabilities

## Overview

Static capabilities (`apps/ttb_studio/app.py:45-61`).

## Signature / Definition

```py
@app.get("/api/capabilities")
```

## Behavior

- All three engines `not-configured`, `premium_studio` selectable but not processing-ready, `generation_ready: False` (`apps/ttb_studio/app.py:47-61`). Only the Python static page calls it.

## Connections

- **depends_on:** [[entities/mod-ttb-studio-python-app]]
- **used_by:** no importer or caller found in source
- **related:** [[concepts/premium-studio]], [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/ttb_studio/app.py`
