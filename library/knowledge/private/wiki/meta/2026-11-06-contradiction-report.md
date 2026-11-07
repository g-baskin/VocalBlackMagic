---
type: meta
title: "Contradiction report 2026-11-06 (update to b58d4574)"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
  - contradiction
related:
  - "[[meta/2026-11-06-lint-report]]"
sources: []
---

# Contradiction report: 2026-11-06

Update pass from `29c84e47` to `b58d4574` (commits `f88cc09` #8, `09057ad` #9, `b58d457` #10). Each row below has the other two artifacts on the page itself: a `[!stale]` callout on the old claim and a `[!contradiction]` callout on the new one. Sources are cited as `path:line` at HEAD.

## TTB Studio routes and music adapters

| Page | Old claim | New claim | Source |
|---|---|---|---|
| [[entities/route-ttb-page]] | Uses `/api/capabilities` and the `/api/generations` family with a 3 s back-off poll, BrandHeader, StatusPanel, `VITE_VOCAL_FIX_URL` | Uses `/api/studio/*` with a fixed 4 s poll; the Vocal Fix link moved to the layout | `apps/ttb-studio/src/routes/+page.svelte:206-310`, `apps/ttb-studio/src/routes/+layout.svelte:7` |
| [[entities/route-ttb-post-generations]] | Used by the TTB page | No browser caller | `apps/ttb-studio/src/routes/+page.svelte:288-291` |
| [[entities/route-ttb-get-generation]] | Used by the TTB page | No browser caller | `apps/ttb-studio/src/routes/+page.svelte:288-291` |
| [[entities/route-ttb-get-generation-audio]] | Used by the TTB page | No browser caller | `apps/ttb-studio/src/routes/+page.svelte:288-291` |
| [[entities/route-ttb-get-capabilities]] | Reads two keys; called by the page | Also reads `REPLICATE_API_TOKEN`; no browser caller | `apps/ttb-studio/src/routes/api/capabilities/+server.ts:13` |
| [[entities/mod-music-capabilities]] | `generation_ready` needs the gate plus fal or Lyria | Also counts `replicateConfigured` | `apps/ttb-studio/src/lib/server/music/capabilities.ts:7`, `:35-37` |
| [[entities/mod-music-fal]] | Private header and failure helpers; fixed ACE-Step app | Exports `falHeaders` and `falFailure`; optional `app` parameter | `apps/ttb-studio/src/lib/server/music/fal.ts:55`, `:63`, `:109`, `:149` |
| [[entities/mod-music-lyria]] | Fixed model `lyria-3.5` | Optional `model` parameter | `apps/ttb-studio/src/lib/server/music/lyria.ts:78` |
| [[entities/mod-ttb-studio-env]] | Declares 2 variables | Declares 9 variables | `apps/ttb-studio/src/env.ts:6-44` |
| [[concepts/hosted-generation-flow]] | No audio is stored server-side | True only for the legacy routes; studio songs are stored | `apps/ttb-studio/src/routes/api/studio/songs/[id]/audio/+server.ts:12-25` |
| [[concepts/premium-studio]] | Premium Studio processing is planned | Studio Master exists as explicit local finishing on a derived copy, but nothing reads the `premium_studio` flag and the studio sets it to false (ambiguous: see [[questions/studio-is-studio-master-premium-studio]]) | `apps/ttb-studio/src/lib/server/studio/derive.ts:173-204`, `apps/ttb-studio/src/lib/server/studio/master.ts:108-116`, `apps/ttb-studio/src/lib/server/studio/create.ts:89` |

## Vocal Fix

| Page | Old claim | New claim | Source |
|---|---|---|---|
| [[entities/route-vf-get-capabilities]] | Proxies to the Python app | Built locally in SvelteKit | `apps/vocal-fix/src/routes/api/capabilities/+server.ts:9-28` |
| [[entities/route-vf-post-references]] | No intent header; called by the home page | 415 without `x-vbm-intent`; no caller in the app | `apps/vocal-fix/src/routes/api/references/+server.ts:14-16` |
| [[entities/route-vf-delete-reference]] | No intent header; called by the home page | 415 without the header; no caller | `apps/vocal-fix/src/routes/api/references/[session_id]/+server.ts:29-30` |
| [[entities/route-vf-page]] | Five-file upload to `/api/references` | Fix (1 file) or Forge (5 files) to `/api/sessions`, then diagnosis | `apps/vocal-fix/src/routes/+page.svelte:66-86` |
| [[entities/mod-vocal-fix-backend]] | Used by four routes | Used only by the three reference routes | `apps/vocal-fix/src/routes/api/capabilities/+server.ts:1-7` |
| [[concepts/production-403-guard]] | Vocal Fix checks dev-only inline in 3 routes | Every route uses `gate.ts`, and the server hook adds a localhost Host check | `apps/vocal-fix/src/lib/server/gate.ts:33-44`, `apps/vocal-fix/src/hooks.server.ts:5-11` |
| [[concepts/reference-session]] | Python sessions; files not verified | SvelteKit sessions of 1 or 5 takes, each fully decoded at intake | `apps/vocal-fix/src/lib/server/service.ts:105-180` |
| [[concepts/gold-vocal]] | Not implemented (501) | Implemented as attributed phrases from repaired takes | `apps/vocal-fix/src/lib/server/service.ts:530-626` |
| [[concepts/consent-record]] | A checkbox value only | Consent object and audit events, plus a typed-name match before training (self-declared, not identity proof) | `apps/vocal-fix/src/lib/server/service.ts:135-173`, `apps/vocal-fix/src/lib/server/forge.ts:17-31` |

## Shared packages

| Page | Old claim | New claim | Source |
|---|---|---|---|
| [[entities/mod-contracts]] | `index.ts` is the whole package; used by the Vocal Fix page | Re-exports voice, studio and engine; Vocal Fix imports it only from forge and voices | `packages/contracts/src/index.ts:92-94`, `apps/vocal-fix/src/lib/server/forge.ts:4` |
| [[entities/contract-validate-generation-request]] | Runs in the browser | Runs on the server only; the editor uses `validateCreateSongRequest` | `apps/ttb-studio/src/routes/api/generations/+server.ts:45`, `apps/ttb-studio/src/routes/+page.svelte:277` |
| [[entities/contract-generation-request]] | Built by the TTB page | No browser builder; used by the route, the adapters and `studio/create.ts` | `apps/ttb-studio/src/lib/server/studio/create.ts:1` |
| [[entities/contract-generation-job]] | Used by the TTB page | The page imports `StudioJob` instead | `apps/ttb-studio/src/routes/+page.svelte:21` |
| [[entities/contract-inline-audio]] | Decoded in the browser | No browser decoder | `apps/ttb-studio/src/lib/server/music/lyria.ts:70` |
| [[entities/contract-vocal-reference-session]] | Used by the Vocal Fix page | No importer in `apps/*/src` | repository grep |
| [[entities/ui-brand-header]] | Used by both app pages | No importer; ArcaneShell replaced it | `packages/ui/src/ArcaneShell.svelte:95-97` |
| [[entities/ui-status-panel]] | Used by both app pages | No importer; OracleStatus replaced it | repository grep |
| [[entities/test-contracts]] | The only contracts test | `engine.test.ts` added with its own page | `packages/contracts/src/engine.test.ts:12-22` |

## Environment variables and external services

| Page | Old claim | New claim | Source |
|---|---|---|---|
| [[entities/env-fal-key]] | Read only by the capabilities and generation routes | Also read by the studio context | `apps/ttb-studio/src/lib/server/studio/context.ts:4`, `:21` |
| [[entities/env-gemini-api-key]] | Read only by the generations route | Also read by the studio lyricist chain and Lyria 3 Pro | `apps/ttb-studio/src/lib/server/studio/context.ts:22`, `:27` |
| [[entities/env-node-env]] | Read by the TTB gate and Vocal Fix reference routes | Vocal Fix has its own gate | `apps/vocal-fix/src/lib/server/gate.ts:3` |
| [[entities/env-vite-ttb-studio-url]] | Read in the Vocal Fix home page | Read in the layout and the forge page | `apps/vocal-fix/src/routes/+layout.svelte:6` |
| [[entities/env-vite-vocal-fix-url]] | Read in the TTB home page | Read in the layout and the library song page | `apps/ttb-studio/src/routes/+layout.svelte:7` |
| [[entities/ext-queue-fal-run]] | Only caller is `fal.ts` | Studio edits also call it | `apps/ttb-studio/src/lib/server/studio/edit.ts:269` |
| [[entities/ext-generativelanguage-googleapis-com]] | Only `lyria.ts` and `lyricist.ts` call it | The studio lyricist chain also calls it | `apps/ttb-studio/src/lib/server/studio/lyrics.ts:166-170` |

## Not contradictions

Prototype pages (`ep-vf-*`, `ep-ttb-*`, `mod-*-python-app`, `test-python-apps`) were checked against HEAD; their sources have no diff since `29c84e47`.
