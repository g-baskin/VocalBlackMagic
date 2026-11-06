---
type: meta
title: "Entities index"
created: "2026-11-06"
updated: "2026-11-06"
status: developing
tags:
  - meta
related: []
sources: []
---

# Entities index

## Modules (20)

- [[entities/mod-auth]]: SaaSSession contract and assertAuthenticated
- [[entities/mod-billing]]: credit ledger and entitlement interfaces
- [[entities/mod-contracts]]: shared generation and session contracts
- [[entities/mod-database]]: ProjectRecord and AudioAssetRecord
- [[entities/mod-music-audio]]: magic-byte sniffing and verified audio streaming
- [[entities/mod-music-capabilities]]: TTBCapabilities builder
- [[entities/mod-music-errors]]: ProviderError and errorResponse status mapping
- [[entities/mod-music-fal]]: fal queue adapter for ACE-Step 1.5
- [[entities/mod-music-gate]]: NODE_ENV development gate, key presence and JSON-only checks
- [[entities/mod-music-jobs]]: fal./lyria. job id prefix codec
- [[entities/mod-music-lyria]]: Gemini interactions adapter for Lyria 3.5
- [[entities/mod-music-lyricist]]: Gemini lyric drafting and filler filter
- [[entities/mod-music-prompt]]: styleDescription and sungLyrics
- [[entities/mod-ttb-studio-backend]]: unused loopback bridge to Python ttb_studio
- [[entities/mod-ttb-studio-env]]: defineEnvVars for FAL_KEY and GEMINI_API_KEY
- [[entities/mod-ttb-studio-python-app]]: legacy FastAPI generation scaffold
- [[entities/mod-vocal-fix-backend]]: upstreamUrl, upstreamUnavailable, passthrough
- [[entities/mod-vocal-fix-python-app]]: FastAPI reference intake prototype
- [[entities/ui-brand-header]]: product header with sister-app link
- [[entities/ui-status-panel]]: aria-live status box

## SvelteKit routes (12)

- [[entities/route-ttb-get-capabilities]]: GET /api/capabilities
- [[entities/route-ttb-get-generation]]: GET /api/generations/[id]
- [[entities/route-ttb-get-generation-audio]]: GET /api/generations/[id]/audio
- [[entities/route-ttb-get-health]]: GET /api/health
- [[entities/route-ttb-page]]: PAGE /
- [[entities/route-ttb-post-generations]]: POST /api/generations
- [[entities/route-vf-delete-reference]]: DELETE /api/references/[session_id]
- [[entities/route-vf-get-capabilities]]: GET /api/capabilities
- [[entities/route-vf-get-health]]: GET /api/health
- [[entities/route-vf-get-reference]]: GET /api/references/[session_id]
- [[entities/route-vf-page]]: PAGE /
- [[entities/route-vf-post-references]]: POST /api/references

## Python endpoints (11)

- [[entities/ep-ttb-get-capabilities]]: GET /api/capabilities
- [[entities/ep-ttb-get-health]]: GET /api/health
- [[entities/ep-ttb-get-root]]: GET /
- [[entities/ep-ttb-post-generations]]: POST /api/generations
- [[entities/ep-vf-delete-reference]]: DELETE /api/references/{session_id}
- [[entities/ep-vf-get-capabilities]]: GET /api/capabilities
- [[entities/ep-vf-get-health]]: GET /api/health
- [[entities/ep-vf-get-reference]]: GET /api/references/{session_id}
- [[entities/ep-vf-get-root]]: GET /
- [[entities/ep-vf-post-process]]: POST /api/references/{session_id}/process
- [[entities/ep-vf-post-references]]: POST /api/references

## Environment variables (17)

- [[entities/env-auth-client-id]]: future placeholder, unread
- [[entities/env-auth-client-secret]]: future placeholder, unread
- [[entities/env-auth-issuer-url]]: future placeholder, unread
- [[entities/env-database-url]]: future placeholder, unread
- [[entities/env-fal-key]]: fal.ai key (secret)
- [[entities/env-gemini-api-key]]: Gemini/Lyria key (secret)
- [[entities/env-host]]: systemd listen address
- [[entities/env-node-env]]: development gate switch
- [[entities/env-object-storage-endpoint]]: future placeholder, unread
- [[entities/env-port]]: systemd listen port
- [[entities/env-stripe-secret-key]]: future placeholder, unread
- [[entities/env-stripe-webhook-secret]]: future placeholder, unread
- [[entities/env-ttb-studio-api-url]]: runtime URL of Python ttb_studio (unused bridge)
- [[entities/env-vfm-data-dir]]: Python session storage directory
- [[entities/env-vite-ttb-studio-url]]: build-time sister link
- [[entities/env-vite-vocal-fix-url]]: build-time sister link
- [[entities/env-vocal-fix-api-url]]: runtime URL of Python vocal_fix

## Contracts (@vbm/contracts) (6)

- [[entities/contract-generation-engines]]: engine id list
- [[entities/contract-generation-job]]: job reply shape and status enum
- [[entities/contract-generation-request]]: generation request body
- [[entities/contract-inline-audio]]: inline base64 audio
- [[entities/contract-validate-generation-request]]: request validator
- [[entities/contract-vocal-reference-session]]: reference-session manifest type

## External services (2)

- [[entities/ext-generativelanguage-googleapis-com]]: Gemini interactions API host
- [[entities/ext-queue-fal-run]]: fal queue API host

## Test suites (4)

- [[entities/test-contracts]]: contracts index.test.ts (bun:test)
- [[entities/test-lyrics]]: lyrics.test.ts (bun:test)
- [[entities/test-music]]: music.test.ts (bun:test)
- [[entities/test-python-apps]]: tests/test_apps.py (pytest)
