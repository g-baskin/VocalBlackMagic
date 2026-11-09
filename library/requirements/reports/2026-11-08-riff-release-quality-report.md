# QA Report: riff creator and built-in arranger release

Plan: goal-folder riff-creator-build.md and riff-arranger-build.md; user approved the in-app arranger while retaining unfinished AI songs in scope, then explicitly requested deployment. Reviewer: main assistant, not an independent reviewer. Existing feature/bm-suno worktree at bbb07d50fd9b64506605c3e3945b95b0b5490955 retained. Candidate manifest: goal-folder riff-deployed-source.sha256, 285 app/package/infra and root package/lock/build-context files, SHA256 f32ab7b690448b8e6652bdc41e5487c3b73159e9272bfb0304bfd5c277a8113d. This includes dirty/untracked implementation; HEAD alone is not the candidate. Secrets, private data, reports and generated build output excluded.

Security review: 2026-11-08-riff-release-security-report.md completed before this Quality pass, with no new medium-or-higher finding and no intervening source changes. Claim boundary: source/local browser and production builds, not signed-in cloud execution, subjective music quality or AI-provider success.

## Summary
Pass for the approved creator and synthesized instrumental arranger release. The broader AI riff-to-song request remains unfinished and visibly disabled. No app, storage or recovery code was changed during release review.

## Scorecard
| Axis | Result |
|---|---|
| Completeness | Pass for creator plus arranger, not full AI songs |
| Correctness | 387 tests / 6987 assertions; both app types/builds, edge types, lint, formatting and diff check pass |
| Alignment | Two apps retained; owner-only Cloudflare deployment; no external-app handoff |
| Gaps | AI engine, phone performance, listening quality, screen reader, cross-device editable projects explicitly unverified/unimplemented |
| Detrimental patterns | No runtime dependency added during release; source preservation and render limits retained |

## Critical Issues (must fix)
None identified in this bounded release.

## Warnings (should fix)
Existing sync data-loss window and lack of backup history are not solved here. Saved library content was inventoried read-only before rollout. AI paid-job persistence remains open; no paid AI feature is enabled by this release. Existing Vite future-config warning remains.

## Suggestions (consider improving)
Owner should test actual phone rendering and use Export editable project for a portable source/section backup. Library currently stores audio plus MIDI, not the full editable arrangement project.

## Plan Item Traceability
| Requirement | Evidence | Status |
|---|---|---|
| In-app riff generation/editing/preview/export | riff.ts, riff-audio.ts, routes/riffs/+page.svelte; creator browser harness | Pass locally |
| Section arrangement and backing tracks | arrangement.ts, RiffArranger.svelte, arrangement-audio.ts | Pass locally |
| Preserve source and editable work | separate source snapshot, explicit adoption, local draft and bounded project import/export tests | Pass locally |
| Real output, no fabricated completion | actual 56-second synthesized WAV, decode and MIDI browser checks | Pass locally |
| Error/retry, consent and explicit save | existing upload boundary and isolated synthetic browser save/retry | Pass locally |
| Mobile layout | 1440/768/390/320px, 200% text, keyboard, scoped axe | Pass within recorded browser scope |
| Render bounds and concurrency | 180-second limit, audio-render guard, focused tests | Pass |
| Keep AI songs in scope without substitution | explicit separate unavailable AI action | Open, not claimed complete |
| Deploy only with approval | user: Deploy them | Authorized now |
| Preserve earlier release/incident work | safeguard and mastering hashes match; real R2 pre-inventory | Pass before rollout |

## Files Changed
Feature source: apps/ttb-studio/src/lib/client/{riff.ts,riff-audio.ts,riff.test.ts,arrangement.ts,arrangement-audio.ts,arrangement.test.ts,audio-render.ts,audio-render.test.ts,RiffArranger.svelte}; routes/riffs/+page.svelte; routes/+page.svelte; routes/upload/+page.svelte; app package.json and bun.lock. Older mastering and safeguard files remain unchanged relative to their deployment receipts. Release adds reports only.

Fresh verification: bun run test; bun run check; bun run lint:web; bun run format:check:web; bun run check:edge; bun run build; git diff --check. Logs /tmp/vbm-riff-release-{tests,build}.log. Earlier browser checks remain applicable to unchanged source: goal-folder arranger-browser-results.json and riff-creator-browser-results.json. No provider, GPU, user-song, destructive storage, authenticated phone or screen-reader test was run. Production Docker rebuild and post-deployment Worker/container identity still to be recorded separately.
