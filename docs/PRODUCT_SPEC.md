# Product specification — Vocal Black Magic

## Product structure
One public monorepo, two **independently runnable apps**. Avoid merging user workflows into a single UI.

### App A — Vocal Fix (vocal-fix)
- Upload **exactly five** recordings of a single authorized vocal performer, each MP3/WAV/FLAC/M4A (initial prototype supports upload and secure local storage; processing is pending).
- Explicit rights/performer consent attestation before accepting recordings.
- Job stages: ingest, transcode/inspect, source separation, voice activity detection, noise and reverb assessment, de-clip/de-noise (when safe), segment quality ranking, Gold Vocal assembly, characteristics extraction, QA, export.
- **Gold Vocal** is a curated, representative, cleaned reference with linked segment provenance, not an average of five waveforms and not automatically a cloned voice.
- Generate an editable descriptive prompt for timbre, range, phrasing, breath, vibrato, grit and performance aesthetic. Descriptions must not falsely assert identity.
- Compare before/after, preserve raw originals, download normalized dry vocal, artifact stems, Gold Vocal WAV, vocal profile JSON and style prompt.
- Optional authorized voice-identity conditioning/training is a separate gated feature: documented speaker authorization, model and dataset consent, clear labelling, revocation/deletion and audit trail.
- Multiple versions, history, cancellation and export; never modify source recordings in place.

### App B — TTB Studio (ttb-studio)
- **Modular monolith:** one app for projects, generation, editor, playback, export and model configuration.
- Prompt-to-beat, lyrics-to-song, prompt-to-instrumental and full-song generation; custom lyrics, voice role and expressive controls.
- Engine adapters: ACE-Step (hosted on fal, development only today), Google Lyria 3.5 (hosted, development only today), HeartMuLa and a configurable third-party 'V2' adapter, **only after provider/API/model rights have been verified**.
- Character presets: Raw / Underground; Vintage / Analog; Live / Organic; Studio Clean; Custom.
- 'Premium Studio' optional switch *independent* of sound preset. Never conflate premium with higher musical authenticity.
- Sliders: rawness/texture, human variation, vocal performance, arrangement complexity, mastering intensity, reference strength and seed where engines support them. Avoid promising controls unsupported by a chosen model; UI must indicate per-engine support.
- Four-version compare, A/B preference tracking, version tree and prompt history, section repaint/extend, remix, audio-to-audio reference, stem split, tempo/key analysis and waveform editor.
- FruityLoops-inspired arrangement workflow: patterns, beat lanes, timeline, piano roll/MIDI export as staged features (do not claim waveform-to-MIDI magically works).
- Export format targets: WAV 24-bit, WAV 16-bit, MP3, FLAC; stems/MIDI only when an actual pipeline exists; store production metadata and provenance.

## End-to-end workflows
1. User creates project; chooses lyrics/instrumental/full song and engine.
2. User selects sound character and optional Premium Studio.
3. Engine generates an original dry master or returns an explicit model-unavailable error.
4. UI retains each original; derived production chains create non-destructive variants.
5. Compare A/B and export with generation metadata.
6. Vocal Fix output may feed TTB **only** with identity/recording rights confirmed.

## Non-goals for the first implementation
- Claiming a specific commercial platform's closed model is available without a contract.
- Automatic impersonation of an unconsenting artist.
- Presenting placeholder waveforms or canned recordings as real AI generations.
- Claiming commercial rights to model outputs without verifying current licenses.
