---
type: entity
title: "vocal_fix DELETE /api/references/{session_id}"
entity_type: function
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal_fix/app.py"
language: py
depends_on:
  - "[[entities/mod-vocal-fix-python-app]]"
used_by:
  - "[[entities/route-vf-delete-reference]]"
last_commit_hash: "3997ab2"
tested_by:
  - "[[entities/test-python-apps]]"
route_method: DELETE
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

# vocal_fix DELETE /api/references/{session_id}

## Overview

Deletes a session folder (`apps/vocal_fix/app.py:149-153`).

## Signature / Definition

```py
@app.delete("/api/references/{session_id}")
```

## Behavior

- Checks the manifest exists, removes the folder with `shutil.rmtree` and returns `deleted: True` (`apps/vocal_fix/app.py:151-153`).

## Connections

- **depends_on:** [[entities/mod-vocal-fix-python-app]]
- **used_by:** [[entities/route-vf-delete-reference]]
- **related:** [[concepts/reference-session]], [[codegraph]]

## Tested by

- [[entities/test-python-apps]]

## History

- **Created:** commit `3877fee` ("Scaffold Vocal Fix and TTB Studio with local APIs, UIs, Docker and CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal_fix/app.py`
