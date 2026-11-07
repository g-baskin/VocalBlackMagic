# Voice rights, consent, provenance and privacy

This project's five-reference workflow is intended for audio you own or have licensed and vocalists who have **explicitly authorized** this use.

- Being able to download a track does not grant rights to train on, imitate or distribute its singer's voice.
- Prior to vocal-identity conditioning, obtain affirmative permission from the speaker for the intended purpose, storage duration and outputs. Record and verify authorization; allow withdrawal where applicable.
- Do not build an unconsented named-artist impersonation feature or suggest a generated voice is an artist's official performance.
- Descriptive attributes (breathy, raspy, expressive, tenor, choral etc.) are distinct from identity replication.
- Attribute synthetic voices and disclose synthetic or modified audio where required by the destination platform, agreement or law.
- Use **private-by-default** asset storage, time-limited retrieval URLs, retention limits, deletion hooks, and configurable downstream-provider data handling. Today, in development, prompts and lyrics go to whichever providers are configured (Replicate, fal, Google, MiniMax, ElevenLabs, Anthropic, OpenAI, or a self-hosted engine). Vocal Fix sends recordings to Replicate for hosted Demucs, enhancement and voice training, and TTB Studio sends a 30 s Gold Vocal excerpt to Replicate for a voice summon. Provider data handling is not yet configurable.
- Never commit reference recordings, model weights, API keys, consent records, or user audio/lyrics to this public GitHub repository.
- Model licenses and training-data rights are independent of this repository's AGPL-3.0-or-later application-code license.
- Uploaded data is currently stored locally **without login or per-user permissions**; it is for private local development only. Do not deploy as-is on a public server.
- Current consent capture (development only): intake records a fixed rights statement and timestamp; voice training additionally requires the performer to type a name matching the session and confirm it is their own voice, and both events go into the session's `manifest.json` audit list. TTB Studio offers only `ready` voices with `own_voice` consent and records the voice id and consent session on each song. This is self-attestation on local disk, not verified identity or a tamper-evident audit trail. Revoking a voice deletes its registry entry and model file.
