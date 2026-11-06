---
type: entity
title: "PORT"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "infra/systemd/vbm-ttb-studio.service"
language: unknown
depends_on: []
used_by: []
last_commit_hash: "0d84c39"
tested_by: []
tags:
  - entity
  - env-var
  - config
related: []
sources:
  - "infra/systemd/vbm-ttb-studio.service"
---

# PORT

## Overview

Listen port for the Bun SvelteKit build under systemd.

## Signature / Definition

```text
PORT
```

## Behavior

- TTB Studio uses 3002 (`infra/systemd/vbm-ttb-studio.service:12`); Vocal Fix uses 3001 (`infra/systemd/vbm-vocal-fix.service:12`). Consumption by the Bun adapter is (unverified) from this repository.

## Connections

- **depends_on:** none found in source
- **used_by:** no importer or caller found in source
- **related:** none

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05
- **Last touched:** commit `0d84c39` ("Add Bun workspace SaaS foundation, shared packages and Docker-free deployment plan") on 2026-11-05

## Sources

- `infra/systemd/vbm-ttb-studio.service`
- `infra/systemd/vbm-vocal-fix.service`
