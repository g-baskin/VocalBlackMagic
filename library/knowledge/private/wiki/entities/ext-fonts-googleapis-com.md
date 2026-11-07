---
type: entity
title: "fonts.googleapis.com"
entity_type: service
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "apps/vocal-fix/src/app.css"
language: ts
depends_on: []
used_by: []
last_commit_hash: "3997ab2"
tested_by: []
tags:
  - "entity"
  - "service"
  - "external"
  - "browser"
related: []
sources:
  - "apps/vocal-fix/src/app.css"
---

# fonts.googleapis.com

## Overview

Google Fonts stylesheet imported by Vocal Fix (`apps/vocal-fix/src/app.css:1`).

## Signature / Definition

```text
https://fonts.googleapis.com
```

## Behavior

- Kind: Real request made by the user's browser when the page loads its stylesheet.
- Caller: CSS `@import` of DM Sans and Fraunces (`apps/vocal-fix/src/app.css:1`); the browser fetches it, exposing visitor IP to Google

## Connections

- **depends_on:** none found in source
- **used_by:** none found in source
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `88c699c` ("Build responsive SvelteKit 3 Vocal Fix and TTB Studio interfaces with CI") on 2026-11-05
- **Last touched:** commit `3997ab2` ("Add shared vocabulary, architecture records and code quality checks") on 2026-11-05

## Sources

- `apps/vocal-fix/src/app.css`
