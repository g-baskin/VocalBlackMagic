# Model selection, sound design and Gold Vocal pipeline

## Generation adapters
- **ACE-Step 1.5**: primary candidate for full-song and instrumental generation, reference conditioning and iteration. Confirm actual published API/weight license and runtime requirements before deployment. Currently used through fal hosting, in development only.
- **Google Lyria 3.5**: hosted, paid alternative engine, development only.
- **Gemini 3.5 Flash-Lite**: writes lyrics automatically for ACE-Step complete songs submitted without lyrics; development only.
- **HeartMuLa**: optional alternate engine, benchmark against ACE-Step for expressive vocals and raw musicality. Verify both repo and **model weights** license separately.
- **External V2**: configurable integration slot. 'Music.ai V2', 'MusicAI V2' and 'AISong V2' must NOT be treated as synonymous. Confirm provider identity, API endpoint, license and allowed outputs. Do not hardcode an unverified endpoint.
- Model selection must be based on listening tests with reproducible prompts, not marketing labels.

## Sound-character pipeline
- Source recording is always immutable; dry output persisted before effects.
- **Raw / Underground:** emphasize rhythmic punch, looser dynamics, audible room and analog coloration; avoid default aggressive limiting.
- **Vintage / Analog:** saturation, mild filtering and optional wow/flutter/texture used conservatively.
- **Live / Organic:** room tone, less quantized feel, natural dynamics and restrained de-essing.
- **Studio Clean:** controlled tonal balance, tighter dynamics and appropriate clarity.
- **Premium Studio** (an independent toggle): quality-focused restoration/equalization, balanced compression, optional stereo processing and transparent loudness/true-peak checks. Output is a new variant. A/B audition against the unprocessed original.
- DSP cannot repair poor composition/performance; prioritize model output quality. Presets must not promise specific instruments or dynamics unsupported by the model.

## Five recordings → Gold Vocal (authorized speakers only)
1. Validate exactly five source files and confirmed recording/speaker rights.
2. Transcode to analysis format; preserve originals and hash/provenance.
3. Source-separate mixed recordings with a verified model (e.g. Demucs) where needed; permit dry vocal uploads.
4. Run VAD and remove long silence; assess SNR, reverb, clipping, phase and source-separation bleed.
5. Extract clean phrases across pitch, intensity and timbre; avoid averaging/crossfading incompatible waveforms.
6. Normalize conservative loudness; assemble *representative dry* segments with timestamps and source references.
7. Generate editable **descriptive** vocal-character profile (range, texture, breathiness, accent as voluntarily specified, phrasing, dynamics and delivery); do not guess protected traits.
8. Quality gate with human audition and consent verification before use as reference conditioning.
9. Optionally use a separate, rights-cleared voice-personalization engine where explicitly authorized.
10. Offer deletion/revocation and reproducibility metadata. Preserve provenance.

## Quality gates
- Input: supported codec, integrity, max duration/size, no malware, consent.
- Separation: listen for bleed, comb filtering and missing consonants; automated metrics alone are insufficient.
- Gold Vocal: no clipped peaks, gross loudness inconsistency, poor source attribution or false identity claim.
- Generated audio: silence detection, clipped peaks, excessive digital artifacts, duration and intelligibility expectations; manual A/B tests. Currently implemented: format sniffing and size bounds (1 KiB to 160 MiB) only.
- Export: correct bit-depth, sample rate, channel count, metadata and no unintended limiter/dither.
