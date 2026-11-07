---
type: meta
title: "Wiki operation log"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Wiki operation log

## 2026-11-06: document (full scan, direct invocation)

- Commit: `29c84e47`. Mode: document. `partial_scan: false` (user-approved full scan; this run also wrote global index pages).
- Pages: modules 20, sveltekit routes 12, python endpoints 11, environment variables 17, contracts (@vbm/contracts) 6, external services 2, test suites 4, concepts 7, questions 2, decisions 0 (3 existing ADRs linked).
- Contradictions: 0 (no prior state). `.legion/file-hashes.json` not generated (driver-only artifact).
- Code graph inputs read only: `codegraph.json`, `codegraph.mmd`, `tools/build_codegraph.py`.

## 2026-11-06: update (`29c84e47` to `b58d4574`, direct invocation)

- Commits covered: `f88cc09` (#8), `09057ad` (#9), `b58d457` (#10). Mode: update, run as five parallel units with disjoint page prefixes (studio server; TTB routes, client and music; Vocal Fix; shared packages; audio engine, env and external services), then one serial pass for global files.
- Totals after the run: 320 entities, 28 concepts, 14 questions. Created about 250 pages; updated about 80.
- Contradictions: 36 rows in [[meta/2026-11-06-contradiction-report]], each with on-page `[!stale]` and `[!contradiction]` callouts. One is ambiguous and has a question page ([[questions/studio-is-studio-master-premium-studio]]).
- Decisions: none filed; `f88cc09` cites the existing ADR 0004, now linked from [[decisions/_index]].
- Code graph: builder extended to `services/**/*.py`, package stylesheets, `api(...)` helper calls, string-concatenated and template URLs, and engine runner calls (`engine_call`). Regenerated at `b58d4574`; deterministic across two runs.
- Overlapping concept pairs kept and cross-linked: [[concepts/ttb-seance]] with [[concepts/studio-seance-blind-comparison]], and [[concepts/ttb-job-polling]] with [[concepts/studio-job-lifecycle]].
- `.legion/file-hashes.json` not generated (driver-only artifact).

