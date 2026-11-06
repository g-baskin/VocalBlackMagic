---
type: meta
title: "Lint report 2026-11-06"
report_type: lint
date: "2026-11-06"
issue_count: 0
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related:
  - "[[meta/_index]]"
sources: []
---

# Lint report 2026-11-06

## Summary

- Pages scanned: 92 (all pages under this wiki).
- Issues found: 0 (0 critical, 0 warnings, 0 suggestions).

## Checks run

- Frontmatter: universal fields, quoted dates, status enum, entity fields and `entity_type` enum.
- Wikilink resolution against every page in the wiki.
- Atomic-page rule: no page over 300 lines.
- Callout vocabulary: only `[!gap]` is used.
- Citation check: every backticked `path:line` resolves to a file at commit `29c84e47` and a line within it.
- No U+2013 or U+2014 characters; no absolute paths.

## Critical (must fix)

None.

## Warnings (should fix)

None.

## Suggestions (worth considering)

- Atomic-page rule 1 (8 to 15 pages per chunk) is not applicable: this was one user-approved full-repo scan, not a driver chunk.
