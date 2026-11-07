# Shared vocabulary

Use these canonical terms in new documentation. Existing API keys remain unchanged.
Mappings describe today's code. Everything implemented runs in development only, on local disk, without authentication.

| Canonical term | Meaning and code mapping | State |
| --- | --- | --- |
| Vocal Fix | Vocal repair and Gold Vocal app, `apps/vocal-fix` (pipeline in the SvelteKit server); legacy Python prototype in `apps/vocal_fix`. | Intake, diagnosis, repair, Gold Vocal and voice training implemented, development only |
| TTB Studio | Song studio, `apps/ttb-studio`; legacy Python prototype in `apps/ttb_studio`. | Generation, song library, edits and Séance implemented, development only |
| Vocal reference session | One (`fix`) or five (`forge`) uploaded recordings with versions, audit events and voices in `manifest.json`. The legacy five-file shape is `VocalReferenceSession`, `session_id`. Not an authenticated login session. | Local manifest implemented |
| Uploaded recording | Source file metadata, `UploadedRecording`; architecture's planned `ReferenceRecording` refers to this domain concept, not a second implemented type. The SvelteKit intake decodes each file and sets `integrity_verified: true` with sha256; the legacy Python intake keeps it false. | Local storage implemented |
| Performer | Speaker or singer identified by legacy `voice_owner`. This name does not establish account ownership or verified authorization. | Name captured |
| Rights attestation | Uploader's `acknowledged_rights` declaration. Not equivalent to a verified `VoiceAuthorization` or consent audit trail. | Boolean captured; verification planned |
| Gold Vocal | Curated clean representative segments with source provenance: ranked phrases joined with silence into a WAV plus a JSON of source timestamps. Never waveform averaging or an automatic identity clone. | Implemented in development; no `GoldVocal` type |
| Vocal profile | Descriptive vocal characteristics (`profile` in the manifest and `VoiceModel`); not an identity model. | Implemented in development |
| Sound character | `SoundCharacter`, `sound_character`; raw, vintage, live, clean or custom. “Character preset” and the architecture's `SoundPreset` describe this selection, not a separate implemented entity. | Selection implemented; rendering planned |
| Premium Studio | Independent `premium_studio` toggle for optional finishing on a derived copy. Not a sound character or billing entitlement. | Selection implemented; processing planned |
| Generation request | `GenerationRequest`: prompt, lyrics, engine, mode and controls. Not generated audio or a completed job. `packages/contracts` `validateGenerationRequest` is authoritative; the Python model is legacy. | Validation implemented |
| Generation engine | Legacy `GenerationEngine` (ace-step, lyria-3.5, heartmula, external-v2) and studio `StudioEngine` ids. External V2 identifies an unconfigured slot, not a verified vendor. | Hosted adapters development-only; heartmula and external-v2 return 501 on the legacy route |
| Model and runner | `StudioModel` is what makes the music; a runner (engine, fal, minimax, elevenlabs, gemini, replicate) is who runs it. `StudioRunnerRecord` stores the runner used and every attempt. | Implemented, development only |
| Engine | The self-hosted music engine, `services/audio-engine`, protocol v1 (`packages/contracts/src/engine.ts`). | Implemented; CI uses a fake backend |
| Forged voice | `VoiceModel` in `data/shared/voices/`: an RVC voice trained on Replicate after own-voice consent. | Implemented, development only |
| Séance | Blind comparison of 2 to 4 models on one prompt; the model is sealed until ranking. | Implemented, development only |
| Generation job | Legacy `GenerationJob` (fal queue jobs use `fal.<id>`; not persisted) and studio `StudioJob` (staged, persisted as JSON under `data/studio/jobs/`). `ModelRun` denotes an individual model execution. | Implemented; `ModelRun` planned |
| Audio asset | Original or derived audio; `AudioAssetRecord` is a future persistence contract. Today songs (`SongMeta`, with stems and masters) and Vocal Fix versions are local files. | Local files only; database contract unused |
| Project | Planned grouping of work, represented by `ProjectRecord`; not a vocal reference session. | Contract only |
| Tenant | Future ownership scope, `tenantId`; not a performer name. | Contract only |
| Authenticated session | `SaaSSession` contract for verified account context, distinct from a vocal reference session. Its assertion helper does not establish authentication. | Contract only |

Other architecture names (`VocalSegment`, `PromptVersion`, `ExportJob`,
`VoiceDeletionRequest`, `AssetProvenance`) describe planned segments, prompt
revisions, export work, revocation/deletion requests and source attribution,
respectively. They are not existing database tables or functioning services.

Sources: [contracts](../packages/contracts/src/index.ts), [studio](../packages/contracts/src/studio.ts), [voice](../packages/contracts/src/voice.ts), [engine](../packages/contracts/src/engine.ts),
[architecture](ARCHITECTURE.md), [product specification](PRODUCT_SPEC.md),
[rights boundaries](RIGHTS_AND_SAFETY.md).
