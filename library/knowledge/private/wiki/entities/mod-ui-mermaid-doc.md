---
type: entity
title: "ui mermaid-doc.ts"
entity_type: module
status: developing
created: "2026-11-06"
updated: "2026-11-06"
path: "packages/ui/src/mermaid-doc.ts"
language: ts
depends_on: []
used_by:
  - "[[entities/ui-design-codex]]"
  - "[[entities/test-ui-mermaid-doc]]"
last_commit_hash: "f88cc09"
tested_by:
  - "[[entities/test-ui-mermaid-doc]]"
tags:
  - entity
  - module
  - package
  - ui
related:
  - "[[entities/ui-mermaid-diagram]]"
sources:
  - "packages/ui/src/mermaid-doc.ts"
---

# ui mermaid-doc.ts

## Overview

Extracts mermaid blocks from markdown (`packages/ui/src/mermaid-doc.ts:24-60`), exported as `@vbm/ui/mermaid-doc`.

## Signature / Definition

```ts
interface DesignDiagram { title; intro; outro; source }
export function extractMermaidDiagrams(markdown: string): DesignDiagram[]
```

## Behavior

- Pairs each block with the nearest `##`/`###` heading and surrounding prose (`packages/ui/src/mermaid-doc.ts:33-57`), stripping links, code and bold marks (`packages/ui/src/mermaid-doc.ts:14-22`).
- Drops empty diagrams (`packages/ui/src/mermaid-doc.ts:59`).

## Connections

- **depends_on:** none found in source
- **used_by:** [[entities/ui-design-codex]], [[entities/test-ui-mermaid-doc]]
- **related:** [[entities/ui-mermaid-diagram]]

## Tested by

- [[entities/test-ui-mermaid-doc]]

## History

- **Created:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06
- **Last touched:** commit `f88cc09` ("VBM upgrade: song studio, real Vocal Fix pipeline, arcane design system, Mermaid design docs (#8)") on 2026-11-06

## Sources

- `packages/ui/src/mermaid-doc.ts`
