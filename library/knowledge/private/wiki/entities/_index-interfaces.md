---
type: meta
title: "Entities index: contracts, UI, routes and endpoints"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Entities index: contracts, UI, routes and endpoints

320 entity pages at `b58d4574`, split across three index pages:

- [[entities/_index]]: modules
- [[entities/_index-interfaces]]: contracts, UI, routes and endpoints
- [[entities/_index-config]]: environment, services, tests and packaging

## Contracts (@vbm/contracts) (25)

- [[entities/contract-create-song-request]]: Body of a song creation request from the TTB editor.
- [[entities/contract-edit-request]]: Suno-style edits (extend, repaint, cover) of a library song; each makes a NEW song with `parent_id`.
- [[entities/contract-engine-health]]: Body of `GET /v1/health` (no auth): process and per-model readiness.
- [[entities/contract-engine-job]]: Job object returned by `POST /v1/jobs` (202), `GET /v1/jobs/{id}` and `DELETE /v1/jobs/{id}`.
- [[entities/contract-engine-job-request]]: Body of `POST /v1/jobs` (Bearer auth, optional `Idempotency-Key`).
- [[entities/contract-engine-protocol-version]]: Protocol version constant, currently `1`.
- [[entities/contract-generation-engines]]: Allowed engine ids.
- [[entities/contract-generation-job]]: Legacy job reply shape.
- [[entities/contract-generation-request]]: Request body for the legacy hosted generation route.
- [[entities/contract-inline-audio]]: Base64 audio carried inside a legacy job reply.
- [[entities/contract-is-voice-model]]: Runtime guards for registry JSON read from disk.
- [[entities/contract-lyrics-request]]: Lyrics write, rewrite or extend request and its validator.
- [[entities/contract-seance]]: The Séance: blind comparison of 2 to 4 models on the same prompt and lyrics.
- [[entities/contract-song-meta]]: Stored metadata of one library song.
- [[entities/contract-studio-engines]]: Legacy engine ids for creating library songs and their capability shape.
- [[entities/contract-studio-job]]: Async studio job with named stages.
- [[entities/contract-studio-model-info]]: Capabilities API shapes: a model with its runners in preference order.
- [[entities/contract-studio-models]]: Models (what makes the music) independent of runners, and the record of which runner ran a song.
- [[entities/contract-validate-create-song-request]]: Shape and range checks shared by UI and server; engine limits are checked separately.
- [[entities/contract-validate-edit-request]]: Shape and range checks for edits; `songSeconds` keeps repaint inside the song when known.
- [[entities/contract-validate-engine-job-request]]: Shared request validation; the doc comment says the Python engine applies the same rules.
- [[entities/contract-validate-generation-request]]: Pure validator for the legacy `/api/generations` request, returning an error message or null.
- [[entities/contract-validate-seance-request]]: Shape checks for `POST /api/studio/seances` and its ranking.
- [[entities/contract-vocal-reference-session]]: Manifest shape of a legacy Python reference session.
- [[entities/contract-voice-model]]: A forged voice and its consent attestation.

## UI components: TTB Studio (5)

- [[entities/ui-ttb-ab-player]]: Single transport that can flip between source A and optional B at the same position.
- [[entities/ui-ttb-mini-wave]]: Small library waveform decoded lazily.
- [[entities/ui-ttb-model-picker]]: Grouped model/engine chooser with a bindable value.
- [[entities/ui-ttb-song-take]]: Result card for one generated song.
- [[entities/ui-ttb-stem-mixer]]: Browser-side stem mixer with mute, solo, volume and WAV export.

## UI components: @vbm/ui (27)

- [[entities/ui-ab-compare]]: Shared Svelte 5 component exported as `@vbm/ui/ABCompare.svelte`.
- [[entities/ui-arcane-input]]: Shared Svelte 5 component exported as `@vbm/ui/ArcaneInput.svelte`.
- [[entities/ui-arcane-panel]]: Shared Svelte 5 component exported as `@vbm/ui/ArcanePanel.svelte`.
- [[entities/ui-arcane-select]]: Shared Svelte 5 component exported as `@vbm/ui/ArcaneSelect.svelte`.
- [[entities/ui-arcane-shell]]: Shared Svelte 5 component exported as `@vbm/ui/ArcaneShell.svelte`.
- [[entities/ui-arcane-textarea]]: Shared Svelte 5 component exported as `@vbm/ui/ArcaneTextarea.svelte`.
- [[entities/ui-brand-header]]: Legacy shared header showing the product name and a sister-app link.
- [[entities/ui-design-codex]]: Shared Svelte 5 component exported as `@vbm/ui/DesignCodex.svelte`.
- [[entities/ui-empty-state]]: Shared Svelte 5 component exported as `@vbm/ui/EmptyState.svelte`.
- [[entities/ui-grimoire-player]]: Shared Svelte 5 component exported as `@vbm/ui/GrimoirePlayer.svelte`.
- [[entities/ui-mermaid-diagram]]: Shared Svelte 5 component exported as `@vbm/ui/MermaidDiagram.svelte`.
- [[entities/ui-oracle-status]]: Shared Svelte 5 component exported as `@vbm/ui/OracleStatus.svelte`.
- [[entities/ui-pitch-trace]]: Shared Svelte 5 component exported as `@vbm/ui/PitchTrace.svelte`.
- [[entities/ui-region-select]]: Shared Svelte 5 component exported as `@vbm/ui/RegionSelect.svelte`.
- [[entities/ui-ritual-progress]]: Shared Svelte 5 component exported as `@vbm/ui/RitualProgress.svelte`.
- [[entities/ui-rune-button]]: Shared Svelte 5 component exported as `@vbm/ui/RuneButton.svelte`.
- [[entities/ui-rune-dropzone]]: Shared Svelte 5 component exported as `@vbm/ui/RuneDropzone.svelte`.
- [[entities/ui-rune-meter]]: Shared Svelte 5 component exported as `@vbm/ui/RuneMeter.svelte`.
- [[entities/ui-rune-recorder]]: Shared Svelte 5 component exported as `@vbm/ui/RuneRecorder.svelte`.
- [[entities/ui-rune-toggle]]: Shared Svelte 5 component exported as `@vbm/ui/RuneToggle.svelte`.
- [[entities/ui-sigil]]: Shared Svelte 5 component exported as `@vbm/ui/Sigil.svelte`.
- [[entities/ui-sigil-loader]]: Shared Svelte 5 component exported as `@vbm/ui/SigilLoader.svelte`.
- [[entities/ui-spectrogram]]: Shared Svelte 5 component exported as `@vbm/ui/Spectrogram.svelte`.
- [[entities/ui-status-panel]]: Legacy live-region status box.
- [[entities/ui-summoning-circle]]: Shared Svelte 5 component exported as `@vbm/ui/SummoningCircle.svelte`.
- [[entities/ui-voice-sigil]]: Shared Svelte 5 component exported as `@vbm/ui/VoiceSigil.svelte`.
- [[entities/ui-waveform]]: Shared Svelte 5 component exported as `@vbm/ui/Waveform.svelte`.

## SvelteKit routes: TTB Studio (39)

- [[entities/route-ttb-delete-studio-jobs-id]]: Cancels a studio job.
- [[entities/route-ttb-delete-studio-songs-id]]: Deletes a song.
- [[entities/route-ttb-error]]: Error boundary page.
- [[entities/route-ttb-get-capabilities]]: Legacy capabilities report for the hosted engines.
- [[entities/route-ttb-get-generation]]: Legacy poll for a fal generation job.
- [[entities/route-ttb-get-generation-audio]]: Legacy verified audio stream for a completed fal job.
- [[entities/route-ttb-get-health]]: Static health response.
- [[entities/route-ttb-get-studio-capabilities]]: Reports what the studio can do now: legacy engines, routed models, and lyric, master and voice readiness.
- [[entities/route-ttb-get-studio-jobs-id]]: Advances and returns one studio job.
- [[entities/route-ttb-get-studio-seances]]: Lists séances.
- [[entities/route-ttb-get-studio-seances-id]]: Returns one séance.
- [[entities/route-ttb-get-studio-seances-leaderboard]]: Returns the séance leaderboard.
- [[entities/route-ttb-get-studio-songs]]: Lists library songs.
- [[entities/route-ttb-get-studio-songs-id]]: Returns one song and its children.
- [[entities/route-ttb-get-studio-songs-id-audio]]: Serves a stored song or stem with range support.
- [[entities/route-ttb-get-studio-songs-id-cover]]: Serves cover art.
- [[entities/route-ttb-get-studio-songs-id-edit]]: Lists which edits the song supports now.
- [[entities/route-ttb-get-studio-voices]]: Lists usable voices for pickers.
- [[entities/route-ttb-layout]]: Root layout wrapping every TTB Studio page in `ArcaneShell`.
- [[entities/route-ttb-page]]: Summon page: the song-creation editor of TTB Studio.
- [[entities/route-ttb-page-arcana]]: Renders `docs/DESIGN.md` through `DesignCodex`.
- [[entities/route-ttb-page-grimoire]]: Component showcase for the shared `@vbm/ui` set.
- [[entities/route-ttb-page-library]]: Song library list with favourite filter, rename and delete.
- [[entities/route-ttb-page-library-id]]: Song detail page: playback, lineage and every derive ritual.
- [[entities/route-ttb-page-lyrics]]: Lyric writing desk that can hand its draft to the summon page.
- [[entities/route-ttb-page-seance]]: Blind comparison of up to four models on one prompt, ranked then revealed.
- [[entities/route-ttb-patch-studio-songs-id]]: Renames or favourites a song.
- [[entities/route-ttb-post-generations]]: Legacy hosted generation entry: ACE-Step (async, fal queue) or Lyria 3.5 (synchronous).
- [[entities/route-ttb-post-studio-lyrics]]: Runs the lyricist chain to write or revise lyrics.
- [[entities/route-ttb-post-studio-seances]]: Starts a blind multi-model comparison.
- [[entities/route-ttb-post-studio-seances-id-rank]]: Records the blind ranking and reveals the models.
- [[entities/route-ttb-post-studio-songs]]: Creates songs: the primary generation entry point at HEAD.
- [[entities/route-ttb-post-studio-songs-id-cover]]: Re-conjures cover art, a paid Replicate call.
- [[entities/route-ttb-post-studio-songs-id-edit]]: Starts an extend, replace-section or restyle job whose result is a new song.
- [[entities/route-ttb-post-studio-songs-id-master]]: Masters a song synchronously into a new song.
- [[entities/route-ttb-post-studio-songs-id-reimagine]]: Starts a reimagine job.
- [[entities/route-ttb-post-studio-songs-id-stems]]: Starts a stem split job.
- [[entities/route-ttb-post-studio-songs-id-voice]]: Starts a voice conversion job with a consented voice.
- [[entities/route-ttb-studio-seances-deps]]: Shared helper for the séance routes; the leading underscore keeps SvelteKit from treating it as a route.

## SvelteKit routes: Vocal Fix (25)

- [[entities/route-vf-delete-reference]]: Legacy proxy delete of a Python reference session.
- [[entities/route-vf-delete-sessions-id]]: Deletes a session and everything derived from it.
- [[entities/route-vf-delete-sessions-id-jobs-job]]: Cancels a queued or running job.
- [[entities/route-vf-delete-voices-voice-id]]: Revokes a trained voice.
- [[entities/route-vf-error]]: Error boundary page.
- [[entities/route-vf-get-capabilities]]: Describes what the local pipeline can do.
- [[entities/route-vf-get-health]]: Static health JSON.
- [[entities/route-vf-get-reference]]: Legacy proxy read of a Python reference session.
- [[entities/route-vf-get-sessions-id]]: Reads one session manifest.
- [[entities/route-vf-get-sessions-id-audio-area-file]]: Streams an original or derived file.
- [[entities/route-vf-get-sessions-id-jobs-job]]: Polls one job.
- [[entities/route-vf-get-voices]]: Lists the shared voice registry.
- [[entities/route-vf-layout]]: Shell around every Vocal Fix page.
- [[entities/route-vf-page]]: Intake page for Vocal Fix sessions.
- [[entities/route-vf-page-arcana]]: Design-system reference page.
- [[entities/route-vf-page-session-id]]: Diagnosis, repair and A/B comparison for one session.
- [[entities/route-vf-page-session-id-forge]]: Own-voice consent and RVC training page.
- [[entities/route-vf-page-session-id-gold]]: Gold Vocal phrase board.
- [[entities/route-vf-page-voices]]: The Codex of trained voices.
- [[entities/route-vf-post-references]]: Legacy proxy upload to the Python prototype.
- [[entities/route-vf-post-sessions]]: Creates a Vocal Fix session from one or five recordings.
- [[entities/route-vf-post-sessions-id-diagnose]]: Session diagnose action.
- [[entities/route-vf-post-sessions-id-forge]]: Session forge action.
- [[entities/route-vf-post-sessions-id-gold]]: Session gold action.
- [[entities/route-vf-post-sessions-id-repair]]: Session repair action.

## HTTP endpoints: audio engine (5)

- [[entities/ep-engine-delete-v1-jobs-job-id]]: Cancels a queued or running job; idempotent.
- [[entities/ep-engine-get-v1-health]]: Public health route reporting protocol, version, device, slot and queue counts, and per-model readiness.
- [[entities/ep-engine-get-v1-jobs-job-id]]: Returns a job's status, stage, progress, error and output.
- [[entities/ep-engine-get-v1-jobs-job-id-audio]]: Streams the finished output file with its content type.
- [[entities/ep-engine-post-v1-jobs]]: Queues a generation job and answers 202 with the public job view.

## HTTP endpoints: Python prototypes (11)

- [[entities/ep-ttb-get-capabilities]]: Static capabilities.
- [[entities/ep-ttb-get-health]]: Process health.
- [[entities/ep-ttb-get-root]]: Serves the static `index.html`.
- [[entities/ep-ttb-post-generations]]: Validates then refuses generation.
- [[entities/ep-vf-delete-reference]]: Deletes a session folder.
- [[entities/ep-vf-get-capabilities]]: Declares intake limits and unimplemented stages.
- [[entities/ep-vf-get-health]]: Process health.
- [[entities/ep-vf-get-reference]]: Returns a session manifest.
- [[entities/ep-vf-get-root]]: Serves the static `index.html`.
- [[entities/ep-vf-post-process]]: Placeholder for Gold Vocal processing.
- [[entities/ep-vf-post-references]]: Creates a local reference session from five uploads.
