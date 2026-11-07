---
type: question
title: "Should BrandHeader and StatusPanel be removed from @vbm/ui?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
sources:
  - "packages/ui/package.json"
---

# Should BrandHeader and StatusPanel be removed from @vbm/ui?

## Evidence

- Both are still exported (`packages/ui/package.json`) but no file in `apps/*/src` imports them at HEAD; ArcaneShell and OracleStatus replaced them in commit `f88cc09`.

## Question

Keep for compatibility or remove? Owner decision.

## Related

- [[entities/ui-brand-header]]
- [[entities/ui-status-panel]]
