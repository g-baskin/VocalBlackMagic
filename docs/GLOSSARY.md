# Shared vocabulary

Use these canonical terms in new documentation. Existing API keys remain unchanged.
Mappings describe today's contracts, not completed audio processing or persistence.

| Canonical term | Meaning and code mapping | State |
| --- | --- | --- |
| Vocal Fix | Reference-intake app, `apps/vocal-fix`; local Python prototype in `apps/vocal_fix`. | Local intake implemented |
| TTB Studio | Music-request editor, `apps/ttb-studio`; local Python prototype in `apps/ttb_studio`. | Editor implemented; hosted generation development-only |
| Vocal reference session | Exactly five uploaded recordings and their metadata; `VocalReferenceSession`, `session_id`. Not an authenticated login session. | Local manifest implemented |
| Uploaded recording | Source file metadata, `UploadedRecording`; architecture's planned `ReferenceRecording` refers to this domain concept, not a second implemented type. Upload does not establish decoded integrity. | Local storage implemented |
| Performer | Speaker or singer identified by legacy `voice_owner`. This name does not establish account ownership or verified authorization. | Name captured |
| Rights attestation | Uploader's `acknowledged_rights` declaration. Not equivalent to a verified `VoiceAuthorization` or consent audit trail. | Boolean captured; verification planned |
| Gold Vocal | Curated clean representative segments with source provenance; planned `GoldVocal`. Never waveform averaging or an automatic identity clone. | Planned |
| Vocal profile | Descriptive vocal characteristics, planned `VocalProfile`; not an identity model. | Planned |
| Sound character | `SoundCharacter`, `sound_character`; raw, vintage, live, clean or custom. “Character preset” and the architecture's `SoundPreset` describe this selection, not a separate implemented entity. | Selection implemented; rendering planned |
| Premium Studio | Independent `premium_studio` toggle for optional finishing on a derived copy. Not a sound character or billing entitlement. | Selection implemented; processing planned |
| Generation request | `GenerationRequest`: prompt, lyrics, engine, mode and controls. Not generated audio or a completed job. `packages/contracts` `validateGenerationRequest` is authoritative; the Python model is legacy. | Validation implemented |
| Generation engine | `GenerationEngine`: ace-step, lyria-3.5, heartmula or external-v2 adapter choice. External V2 identifies an unconfigured slot, not a verified vendor. | ace-step (fal) and lyria-3.5 hosted adapters development-only; others unconfigured |
| Generation job | `GenerationJob`: provider job reference and status (fal queue jobs use `fal.<id>`); not persisted. `ModelRun` denotes an individual model execution. | Job contract implemented, not persisted; `ModelRun` planned |
| Audio asset | Original or derived audio; `AudioAssetRecord` is a future persistence contract. `StemAsset` is a planned separated stem; `MixVersion` a versioned derived mix. | Contracts/plans only beyond local uploads |
| Project | Planned grouping of work, represented by `ProjectRecord`; not a vocal reference session. | Contract only |
| Tenant | Future ownership scope, `tenantId`; not a performer name. | Contract only |
| Authenticated session | `SaaSSession` contract for verified account context, distinct from a vocal reference session. Its assertion helper does not establish authentication. | Contract only |

Other architecture names (`VocalSegment`, `PromptVersion`, `ExportJob`,
`VoiceDeletionRequest`, `AssetProvenance`) describe planned segments, prompt
revisions, export work, revocation/deletion requests and source attribution,
respectively. They are not existing database tables or functioning services.

Sources: [contracts](../packages/contracts/src/index.ts),
[architecture](ARCHITECTURE.md), [product specification](PRODUCT_SPEC.md),
[rights boundaries](RIGHTS_AND_SAFETY.md).
