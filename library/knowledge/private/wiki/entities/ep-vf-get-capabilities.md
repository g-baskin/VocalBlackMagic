---
type: entity
title: "vocal_fix GET /api/capabilities"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on:
  - "[[entities/mod-vocal-fix-python-app]]"
used_by:
  - "[[entities/route-vf-get-capabilities]]"
last_commit_hash: "3997ab2"
tested_by: []
route_method: GET
route_path: "/api/capabilities"
tags:
  - entity
  - function
  - vocal-fix
  - python-endpoint
related:
  - "[[concepts/gold-vocal]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal_fix/app.py"
---

# vocal_fix GET /api/capabilities

## Overview

Declares intake limits and unimplemented stages (`apps/vocal_fix/app.py:61-72`).

## Signature / Definition

```py
@app.get("/api/capabilities")
```

## Behavior

- Reports 5 references, allowed formats, 25 MiB, `ingestion: available`, `vocal_separation`/`gold_vocal`/`prompt_generation` `not-implemented`, `public_deployment_safe: False` (`apps/vocal_fix/app.py:63-72`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-python-app]]
- **used_by:** [[entities/route-vf-get-capabilities]]
- **related:** [[concepts/gold-vocal]], [[codegraph]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
