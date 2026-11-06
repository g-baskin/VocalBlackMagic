---
type: entity
title: "vocal_fix GET /api/references/{session_id}"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on:
  - "[[entities/mod-vocal-fix-python-app]]"
used_by:
  - "[[entities/route-vf-get-reference]]"
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
route_method: GET
route_path: "/api/references/{session_id}"
tags:
  - entity
  - function
  - vocal-fix
  - python-endpoint
related:
  - "[[concepts/reference-session]]"
  - "[[codegraph]]"
sources:
  - "apps/vocal_fix/app.py"
---

# vocal_fix GET /api/references/{session_id}

## Overview

Returns a session manifest (`apps/vocal_fix/app.py:144-146`).

## Signature / Definition

```py
@app.get("/api/references/{session_id}")
```

## Behavior

- Delegates to `metadata_or_404`, which 404s for non-canonical UUIDs or a missing manifest (`apps/vocal_fix/app.py:34-48`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-python-app]]
- **used_by:** [[entities/route-vf-get-reference]]
- **related:** [[concepts/reference-session]], [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
