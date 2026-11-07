# Song Studio

> Category: Architecture | Version: 1.0 | Date: November 2026 | Status: Active

For engineers working on TTB Studio: the `/api/studio/**` surface, the file-backed song library and job store, legacy engines versus the models x runners router, derived songs and edits, and the Séance. Pinned to commit b58d4574. Development only, unauthenticated, paid per request.

**Related:**
- [`audio-engine.md`](audio-engine.md)
- [`music-generation-pipeline.md`](music-generation-pipeline.md) (legacy `/api/generations`)
- [`vocal-fix-pipeline.md`](vocal-fix-pipeline.md) (writes the voice registry)
- [`../security/trust-boundaries.md`](../security/trust-boundaries.md)
- [`../../../../docs/decisions/0002-modular-monolith.md`](../../../../docs/decisions/0002-modular-monolith.md)

---

## Why it exists

The legacy generation route streamed a song and kept nothing. The studio keeps every take in a local library so it can be split, mastered, re-sung, edited and compared. Generation is split into a *model* (what makes the music) and a *runner* (who runs it), so one model can move between a self-hosted GPU and hosted APIs.

## Gate

Every studio route except capabilities calls `guard(request, needsJson)` first (`apps/ttb-studio/src/lib/server/studio/context.ts:49-59`). It returns 403 unless `NODE_ENV === 'development'` (`apps/ttb-studio/src/lib/server/music/gate.ts:1-12`). It also returns 403 unless the Host header is `localhost`, `127.0.0.1` or `[::1]` (`apps/ttb-studio/src/lib/server/studio/paths.ts:22-25`). For writes it returns 415 unless the body is `application/json`. `GET /api/studio/capabilities` has no guard and reports readiness booleans, model and runner status, and a usable-voice count (`apps/ttb-studio/src/routes/api/studio/capabilities/+server.ts:10-39`). There is no caller identity: song, job and séance ids are the only keys.

## Storage

`dataDir()` is `VBM_DATA_DIR` or `<repo root>/data` (`paths.ts:4-19`). Songs live in `<data>/studio/songs/<uuid>/` with `meta.json`, audio, `stems/` and a cover (`apps/ttb-studio/src/lib/server/studio/library.ts:44-60`; `SongMeta` at `packages/contracts/src/studio.ts:70-97`). Jobs are `<data>/studio/jobs/<uuid>.json`, written to a temp file and renamed (`apps/ttb-studio/src/lib/server/studio/jobs.ts:78-127`). Séances are stored in `<data>/studio/seances` (`apps/ttb-studio/src/lib/server/studio/seance.ts:78`). Every stored audio file passes `verifiedAudioResponse` (sniff plus 1 KiB to 160 MiB) before it is written (`jobs.ts:245-262`).

## Creating a song

```mermaid
sequenceDiagram
    participant browser as Browser
    participant route as POST /api/studio/songs
    participant create as createSongs
    participant lyr as Lyricist chain
    participant router as route()
    participant runner as Runner
    participant lib as data/studio

    browser->>route: CreateSongRequest JSON
    route->>route: guard, validateCreateSongRequest
    route->>create: request
    create->>create: key checks (503), assertJobCapacity (429)
    opt vocals and no lyrics and model does not write its own
        create->>lyr: write
        lyr-->>create: lyrics, title
    end
    alt model set
        create->>router: model
        loop runners in preference order
            router->>runner: submit if available
            runner-->>router: job, audio, or RunnerRefused
        end
    else legacy engine
        create->>runner: Replicate, fal or Lyria 3.5
    end
    create->>lib: job JSON (running) or stored songs (completed)
    route-->>browser: 202 job, lyrics, title
    loop polling
        browser->>route: GET /api/studio/jobs/id
        route->>runner: advanceJob polls and stores verified audio
    end
```

The route validates the shape with `validateCreateSongRequest` (`packages/contracts/src/studio.ts:155-206`) and answers 202 (`apps/ttb-studio/src/routes/api/studio/songs/+server.ts:23-31`). `createSongs` checks keys for the selected path and answers 503 when one is missing (`apps/ttb-studio/src/lib/server/studio/create.ts:107-124`). It then refuses with 429 if 3 jobs are `running` and inside their deadline, or 4 for séance takes (`jobs.ts:150-182`). Synchronous direct runners finish within the request and are never recorded as running, so the cap does not count them while in flight. This cap is a local runaway guard, not a spend limit.

**Lyrics.** Lyrics are written unless the song is instrumental, the caller supplied them, or the model writes its own (Lyria 3.5 or Lyria 3 Pro) (`create.ts:127-151`). `runLyricistChain` tries Anthropic, OpenAI and Gemini direct APIs, each with a 60 s timeout, then Claude on Replicate (`apps/ttb-studio/src/lib/server/studio/lyrics.ts:229-269`). The model ids are in `lyrics.ts:118-126`.

**Legacy engines.** The `StudioEngine` ids are `minimax-music-1.5` (the UI default, `apps/ttb-studio/src/routes/+page.svelte:46`), `ace-step-replicate`, `stable-audio-2.5`, `lyria-2`, `fal-ace-step` and `lyria-3.5` (`packages/contracts/src/studio.ts:4-11`). Replicate models are in `apps/ttb-studio/src/lib/server/studio/engines.ts:111-133`. Lyria 3.5 is synchronous and stored at once; fal and Replicate become polled tasks (`create.ts:243-279`).

**Models x runners.** There are seven models: `ace-step-1.5`, `heartmula`, `diffrhythm`, `yue`, `minimax-music-2.6`, `lyria-3-pro` and `elevenlabs-music`. Each lists runners in preference order: engine, then the provider API, then Replicate (`apps/ttb-studio/src/lib/server/studio/runners/models.ts:1-278`). A runner is unavailable when its key is missing, or for the engine when `/v1/health` says the model is not ready (`apps/ttb-studio/src/lib/server/studio/runners/router.ts:30-45`). `route()` falls back *only* when a runner was unavailable or threw `RunnerRefused` at create time. Any other error is rethrown, so an accepted job is never resubmitted elsewhere (`router.ts:57-100`). Further takes run on the same runner, and a later take that fails keeps the takes already accepted (`apps/ttb-studio/src/lib/server/studio/runners/routed.ts:135-179`). The chosen runner and every attempt are saved as `runner` in `meta.json` (`routed.ts:167-174`). The code labels licences and `commercial` per runner. These labels are not verified here; for example, the self-hosted YuE2 is labelled `CC-BY-NC-4.0`, commercial false (`models.ts:166-172`). Estimated costs per model are in `routed.ts:36-44`.

## Job lifecycle

A job is recorded as `running` with a 20 minute deadline (`jobs.ts:184-207`, `jobs.ts:74`). `GET /api/studio/jobs/{id}` calls `advanceJob`. It takes a directory lock, polls each running task and stores finished audio. It keeps a task running on 429, 503, 504 or timeout, fails it on other errors, and on deadline cancels it upstream and fails it (`jobs.ts:462-504`). `DELETE` cancels the Replicate or engine tasks and answers 409 while the lock is held (`jobs.ts:506-526`). A job completes if any take was stored, with a note on failed takes (`jobs.ts:420-440`). fal tasks are not canceled upstream.

## Derived songs and edits

Each derived result is a new song with `parent_id`; the parent is never rewritten.

- Stems: Demucs on Replicate (`apps/ttb-studio/src/lib/server/studio/derive.ts:36`).
- Reimagine: MiniMax Music-01 (`derive.ts:61`).
- Voice: RVC with a registry voice (`derive.ts:128`).
- Master: local ffmpeg loudnorm to -14 LUFS and -1 dBTP; ffmpeg comes from `FFMPEG_PATH`, PATH or `/usr/local/bin` (`apps/ttb-studio/src/lib/server/studio/master.ts:4-23`, `derive.ts:173`).
- Cover art: FLUX Schnell, about $0.003, inherited by derived songs (`apps/ttb-studio/src/lib/server/studio/cover.ts:15-17`, `cover.ts:133`). A cover failure never fails the song (`jobs.ts:406-418`).
- Voice summon: MiniMax Music-01 with a 30 s excerpt of the voice's Gold Vocal and a music reference (`apps/ttb-studio/src/lib/server/studio/voicesummon.ts`, excerpt at `master.ts:118-156`).

Only voices that are `ready`, have `consent.own_voice === true` and have a model file or HTTPS URL are offered (`apps/ttb-studio/src/lib/server/studio/voices.ts:5-13`).

Edits (extend, repaint, cover) run on the self-hosted engine when its health lists the task. Otherwise they use fal ACE-Step v1 edit endpoints. The code comment says the fal path was never run live (`apps/ttb-studio/src/lib/server/studio/edit.ts:1-15`). Fallback follows the same refuse-before-create rule (`edit.ts:285-360`).

## The Séance

A séance sends one take per model for 2 to 4 distinct models (`packages/contracts/src/studio.ts:326-330`). Takes go through `createSongs`, so they pass its gates and cap, and are labelled A to D in shuffled order (`seance.ts:19-24`, `seance.ts:85`). Until the séance is ranked, `sealSongs` strips the engine, runner, model params, cost and any model-written lyrics from every song response. An unreadable séance stays sealed (fail closed) (`apps/ttb-studio/src/lib/server/studio/seal.ts:1-44`, used by the songs routes). Ranking reveals the models and feeds a leaderboard (`seance.ts:272-377`).
