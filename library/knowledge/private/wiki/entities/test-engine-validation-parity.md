---
type: entity
title: "tests/test_validation_parity.py (shared fixture parity)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "services/audio-engine/tests/test_validation_parity.py"
language: py
depends_on:
  - "[[entities/mod-engine-validation]]"
  - "[[entities/mod-contracts-engine]]"
used_by: []
last_commit_hash: "09057ad"
tested_by: []
tags:
  - "entity"
  - "module"
  - "engine"
  - "test"
related:
  - "[[concepts/engine-validation-parity]]"
sources:
  - "services/audio-engine/tests/test_validation_parity.py"
---

# tests/test_validation_parity.py (shared fixture parity)

## Overview

Runs every case of `packages/contracts/fixtures/engine-requests.json` through the Python validator (`services/audio-engine/tests/test_validation_parity.py:11-22`).

## Signature / Definition

```text
@pytest.mark.parametrize("case", CASES) def test_matches_shared_fixture(case)
```

## Behavior

- Optional `pad` entries expand a key to `ch * n` characters before validating (`services/audio-engine/tests/test_validation_parity.py:17-21`).
- Not run in this pass.

## Connections

- **depends_on:** [[entities/mod-engine-validation]], [[entities/mod-contracts-engine]]
- **used_by:** none found in source
- **related:** [[concepts/engine-validation-parity]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06
- **Last touched:** commit `09057ad` ("Self-hosted music engine and provider-agnostic routing (checkpoint) (#9)") on 2026-11-06

## Sources

- `services/audio-engine/tests/test_validation_parity.py`
