---
ai_description: |
  Internal engineering and business documentation. ADRs live in
  architecture/ADR-<n>-<kebab-slug>.md; shared CTRs live in
  contracts/CTR-<###>-<slug>.md; documentation standards live in
  standards/documentation-framework.md. Add only source-backed domains.
  Internal evidence and unresolved findings must not become public by default.
human_description: |
  Knowledge for engineering, founders, sales, service, account teams, and
  other internal readers. Includes architecture, business insights, decisions,
  operations, and approved internal explanatory manuscripts.
---

# Knowledge: Private

This area explains the system and business to the team. It also holds the evidence and decisions that support audience documents.

## Shared folders

| Folder | Contents |
| --- | --- |
| `architecture/` | Architecture narratives and `ADR-<n>-<kebab-slug>.md` decision records |
| [`contracts/`](contracts/README.md) | `CTR-<###>-<slug>.md` shared API, event, data, permission, or state agreements |
| `standards/` | `standards/documentation-framework.md` and repository writing or engineering rules |

## Current-state documents

| Document | Covers |
| --- | --- |
| [`architecture/test-strategy.md`](architecture/test-strategy.md) | CI jobs, Bun and pytest coverage, untested areas |
| [`architecture/music-generation-pipeline.md`](architecture/music-generation-pipeline.md) | TTB Studio generation via fal ACE-Step and Lyria |
| [`architecture/vocal-reference-storage.md`](architecture/vocal-reference-storage.md) | Vocal Fix intake, on-disk layout, manifest, delete |
| [`architecture/song-studio.md`](architecture/song-studio.md) | TTB studio API, song library, jobs, models x runners router, edits, Séance |
| [`architecture/vocal-fix-pipeline.md`](architecture/vocal-fix-pipeline.md) | SvelteKit Vocal Fix intake, repair, Gold Vocal, voice forge and consent |
| [`architecture/audio-engine.md`](architecture/audio-engine.md) | Self-hosted music engine, protocol v1, token, queue, backends |
| [`auth/session-and-tenancy-model.md`](auth/session-and-tenancy-model.md) | Auth, database and billing contract packages |
| [`security/trust-boundaries.md`](security/trust-boundaries.md) | Network and trust boundaries, dev gates |

## Strategy and research

Research notes explain options; they do not approve work. See [`strategy/`](strategy/README.md).

| Document | Covers |
| --- | --- |
| [`strategy/hum-to-beat-research.md`](strategy/hum-to-beat-research.md) | Hum, chant or beatbox into a beat: market tools, open-source parts and licenses, suggested "Hum It" feature |

## Add domains as needed

Use domains such as `auth/`, `data/`, `security/`, `operations/`, `strategy/`, `personas/`, or `reporting/` when the sources support them. Add a README that explains the domain. Do not seed unrelated domains or assume a technology stack.

App Primer Zero, when available, builds the private current-state and foundation material before implementation. Library Packets uses supported sources to write documents for specific readers. Keep their draft decisions, source gaps, evidence, and review records private until the owner approves a public statement.

## Store the right material

Keep PRDs in `requirements/` and IRDs in `issues/`. Keep curated explanatory Markdown here when it is internal. Put approved external Markdown in `knowledge/public/`. Keep brand assets and generated Word/PDF files at an agreed location outside `library/`.
