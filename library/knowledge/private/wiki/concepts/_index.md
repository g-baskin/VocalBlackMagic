---
type: meta
title: "Concepts index"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Concepts index

- [[concepts/consent-record]]: Consent record (rights attestation). Self-declared attestations stored with a session: a rights acknowledgement at intake and a typed-name own-voice statement before voice training.
- [[concepts/contracts-engine-protocol-parity]]: Engine protocol parity (TS and Python). The self-hosted engine contract is defined twice: in TypeScript for TTB Studio and in Python for the worker.
- [[concepts/dev-only-generation-gate]]: Dev-only generation gate. Hosted song generation in TTB Studio runs only when `NODE_ENV` is `development`, because there is no user identity, tenant scoping or spending cap yet.
- [[concepts/engine-deployment-targets]]: Engine deployment targets. Three ways to run the engine (local process, Docker on a GPU host, Modal) and how auth and the Host guard differ.
- [[concepts/engine-job-lifecycle]]: Engine job lifecycle. How a VBM Engine job moves from `queued` to `succeeded`, `failed` or `cancelled`, and what survives a restart.
- [[concepts/engine-model-readiness]]: Engine model readiness. Health reports a model ready only when dependencies, weights and hardware all allow a run now.
- [[concepts/engine-validation-parity]]: Engine validation parity. The engine request validator exists twice, in TypeScript and Python, and must give identical messages.
- [[concepts/gold-vocal]]: Gold Vocal. A curated set of clean representative vocal phrases with source provenance; never waveform averaging or an automatic identity clone.
- [[concepts/hosted-generation-flow]]: Hosted generation flow. The path a TTB Studio song request takes from the editor through provider adapters and back as verified audio.
- [[concepts/premium-studio]]: Premium Studio. An independent `premium_studio` toggle for optional finishing on a derived copy; not a sound character or billing entitlement.
- [[concepts/production-403-guard]]: Production 403 guard. Every route that stores, reads or deletes user audio, or spends provider credit, answers 403 unless `NODE_ENV` is `development`.
- [[concepts/reference-session]]: Vocal reference session. A UUID-named folder of uploaded recordings plus `manifest.json`.
- [[concepts/studio-derived-songs]]: Studio derived songs. Stems, reimagine, voice conversion, Studio Master and edits all produce a new song with `parent_id`; the parent files are never written.
- [[concepts/studio-job-lifecycle]]: Studio job lifecycle. Paid studio work is a file-backed job: submitted provider tasks, polled on read, stored as verified library songs, with a spend cap and a 20 minute deadline.
- [[concepts/studio-lyricist-chain]]: Studio lyricist chain. Lyrics for vocal songs without user lyrics are written by Anthropic, OpenAI, Gemini, then Replicate Claude, stopping at the first usable answer.
- [[concepts/studio-models-and-runners]]: Studio models and runners. A model makes the music; a runner is who runs it.
- [[concepts/studio-seance-blind-comparison]]: Seance blind model comparison. A seance runs one take per model with shared prompt and lyrics under shuffled labels, hides identifying metadata until the user ranks, then feeds a leaderboard.
- [[concepts/studio-song-library]]: Studio song library. Songs persist as folders `<data>/studio/songs/<uuid>/` holding `meta.json`, audio, stems and cover, under a data dir from `VBM_DATA_DIR` or the repo root.
- [[concepts/ttb-job-polling]]: TTB Studio job polling. Browser loops that GET a job or séance until it leaves `queued`/`running`; the server advances the job on each poll.
- [[concepts/ttb-legacy-generation-api]]: TTB Studio legacy generation API. The `/api/generations` and `/api/capabilities` routes from before `f88cc09`; still deployed in source at HEAD with unchanged handlers, but no browser caller.
- [[concepts/ttb-seance]]: The Séance (blind model comparison). A blind A/B/C/D test: one prompt to up to four models, the user ranks unlabeled takes, then models are revealed and a leaderboard updates.
- [[concepts/ttb-studio-api-surface]]: TTB Studio API surface. The `/api/studio/*` SvelteKit endpoints added in `f88cc09` that the browser uses at HEAD: songs, jobs, lyrics, voices, séances and capabilities.
- [[concepts/ui-arcane-design-system]]: Arcane design system (@vbm/ui). The shared Svelte 5 component library both apps import as `@vbm/ui/<Component>.svelte`, with one theme stylesheet.
- [[concepts/ui-real-audio-visuals]]: Real audio visuals (no fabricated waveforms). Every audio visual in `@vbm/ui` is computed from decoded audio or a live analyser; with no audio, components show an empty state rather than decoration.
- [[concepts/vocal-fix-job-runner]]: Vocal Fix job runner. In-process queue for repair and forge work with status persisted to disk.
- [[concepts/vocal-fix-mutation-guard]]: Vocal Fix mutation guard. Layered checks every Vocal Fix state-changing route runs: loopback Host, development-only, and a non-simple request (JSON or `x-vbm-intent`).
- [[concepts/vocal-fix-repair-pipeline]]: Vocal Fix repair pipeline. The SvelteKit server path that takes verified recordings through diagnosis, optional hosted isolation and enhancement, and a local ffmpeg polish into new der...
- [[concepts/vocal-fix-voice-forge]]: Vocal Fix voice forge. Training an RVC voice model on Replicate from Gold Vocal segments after an own-voice attestation, then recording it in the shared voice registry.
