---
type: entity
title: "HOST"
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

# HOST

## Overview

Listen address for the Bun SvelteKit build under systemd.

## Signature / Definition

```text
HOST
```

## Behavior

- Both units set `HOST=127.0.0.1` (`infra/systemd/vbm-ttb-studio.service:11`, `infra/systemd/vbm-vocal-fix.service:11`). Consumption by the Bun adapter at runtime is (unverified) from this repository.

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
