---
type: entity
title: "ui theme.css (arcane tokens)"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/theme.css"
language: css
depends_on: []
used_by: []
last_commit_hash: "f88cc09"
tested_by: []
tags:
  - entity
  - module
  - package
  - ui
  - design-tokens
related:
  - "[[entities/mod-ui-canvas]]"
  - "[[concepts/ui-arcane-design-system]]"
sources:
  - "packages/ui/src/theme.css"
---

# ui theme.css (arcane tokens)

## Overview

Global arcane design tokens and base styles, exported as `@vbm/ui/theme.css`.

## Signature / Definition

```ts
--vbm-void, --vbm-obsidian, --vbm-violet, --vbm-ember, --vbm-teal, --vbm-gold, --vbm-font-display/body/mono, --vbm-clip, --vbm-focus; legacy aliases --bg, --panel, --text, --accent
```

## Behavior

- Self-hosts Cinzel, Cormorant Garamond and JetBrains Mono through fontsource (`packages/ui/src/theme.css:1-7`).
- Colour, glow and font tokens (`packages/ui/src/theme.css:9-50`); legacy variable names alias the new tokens (`packages/ui/src/theme.css:52-58`).
- Teal focus ring (`packages/ui/src/theme.css:50`, `packages/ui/src/theme.css:118`), `.vbm-sr-only` (`packages/ui/src/theme.css:123`) and a reduced-motion block (`packages/ui/src/theme.css:175`).
- Imported by both root layouts (`apps/ttb-studio/src/routes/+layout.svelte:3`, `apps/vocal-fix/src/routes/+layout.svelte:3`).

## Connections

- **depends_on:** none found in source
- **used_by:** 2 app layouts, listed in Behavior
- **related:** [[entities/mod-ui-canvas]], [[concepts/ui-arcane-design-system]]

## Tested by

- No test found in the repository for this entity.

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/theme.css`
