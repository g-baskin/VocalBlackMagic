---
type: entity
title: "ACESTEP_SRC"
entity_type: env-var
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/install-ace-step.sh"
language: unknown
depends_on: []
used_by:
  - "[[entities/engine-install-ace-step]]"
last_commit_hash: "b58d457"
tested_by: []
tags:
  - "entity"
  - "env-var"
  - "config"
related: []
sources:
  - "services/audio-engine/install-ace-step.sh"
---

# ACESTEP_SRC

## Overview

Clone target for the ACE-Step install script (`services/audio-engine/install-ace-step.sh:8`).

## Signature / Definition

```text
ACESTEP_SRC
```

## Behavior

- Readers: `services/audio-engine/install-ace-step.sh:8`, `:10-13`.
- Default: `/opt/ace-step`.
- Validation: none.
- Secrecy: not a secret.

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/engine-install-ace-step]]
- **related:** none found in source

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06
- **Last touched:** commit `b58d457` ("Studio: model picker, Suno-style editing, the Séance; engine packaging and CI (#10)") on 2026-11-06

## Sources

- `services/audio-engine/install-ace-step.sh`
