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

## Update pass to `b58d4574`

- Pages scanned: 376 (all pages under this wiki).
- Issues found and fixed during the pass: 4 dangling wikilinks (two engine endpoint names, one Vocal Fix backend name, and a missing `ext-replicate-delivery` page, now written), 11 question pages with `status: open` (set to `developing`, the schema enum), and `entities/_index.md` at 395 lines (split into `entities/_index`, `entities/_index-interfaces` and `entities/_index-config`).
- Remaining issues: 0 critical, 0 warnings.
- Checks run: universal frontmatter fields and quoted dates, `last_commit_hash` on every entity, status enum, wikilink resolution, 300-line cap, no U+2013 or U+2014 characters, no absolute paths, and every backticked `path:line` resolving to a file and line at `b58d4574`.
- Callouts in use: `[!contradiction]` 52, `[!stale]` 37, `[!gap]` 12. See [[meta/2026-11-06-contradiction-report]].
- Suggestion: two concept pairs overlap ([[concepts/ttb-seance]] and [[concepts/studio-seance-blind-comparison]]; [[concepts/ttb-job-polling]] and [[concepts/studio-job-lifecycle]]). They describe the browser and server sides and are now cross-linked; merging them is a human call.
