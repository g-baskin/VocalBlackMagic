# Security audit - 2026-11-08 - built-in riff creator and arranger

## Executive summary
Scope: new /riffs UI, riff/arrangement models and exports, browser audio rendering, existing upload boundary, dependency/lock changes, preserved deployment/storage safeguards. Reviewed against the implementation retained in this conversation and fresh release checks. REDUCED COVERAGE: owner-only Cloudflare Access/Container/R2, not the skill's Neon/WorkOS/Stripe/Vercel stack; no whole-repository security certification. No new Critical, High, Medium or Low finding identified in this feature scope. Proceed to quality review.

## Surface coverage checklist
### SvelteKit attack surface
None detected in the candidate. No new server endpoint, raw HTML renderer or executable project import. Project files are capped at 50KB, JSON parsed, allowlisted and bounded; audio validates before allocation, has a 180-second ceiling and a shared concurrency gate. Riff source copied rather than rewritten. Unit and browser malformed-import/source-preservation checks pass.
### Authorization and tenancy (Drizzle / Neon)
Not applicable to this owner-only deployment. No change to Access, owner/edge-secret, upload intent or rights gates. Save reuses /api/studio/uploads. Fresh edge tests cover invalid/absent login, spoofed forwarding headers and app port isolation. Not a public multi-user clearance.
### Secrets and environment
None detected by fresh source gitleaks scan. Browser feature uses no provider credentials. Docker ignore excludes .env files, data, local state and the private library. Existing account verified with Wrangler; no login, key rotation or new access mechanism.
### Webhooks and third-party intake
No new webhook/provider request. Project files and on-device drafts treated as untrusted. Existing authenticated upload preserved. AI song action remains unavailable rather than silently issuing unrelated text generation.
### Dependencies and supply chain
Tone 15.1.22 and Tonal 6.5.1 are the researched editor dependencies; @types/bun 1.4.4 is dev-only. Existing @tonejs/midi reused. No release-time dependency additions. Production Docker uses bun install --frozen-lockfile. No new install scripts authored. No comprehensive fresh CVE certification claimed.
### Headers and transport
No changes. Access-protected HTTPS Worker retained. Live signed-out redirects and deployment status to be checked after rollout; signed-in phone behavior requires owner confirmation.
### AI-generated code patterns
None detected in bounded feature checks. Original vs derived/copy behavior explicit, no fake generated audio or waveform. Existing R2 deletion safeguard and all eight mastering source receipts verified byte-for-byte unchanged before release. 39 focused tests / 2931 assertions passed across editor, arrangement, concurrency and infrastructure.
### PII and logging hygiene
No new telemetry or project logging. Local draft/source snapshot stays on device unless explicitly exported/uploaded. Library stores audio and MIDI, not cross-device editable section projects; UI discloses this. Read-only R2 pre-release inventory retained privately: 27 objects / seven song metadata records.

## Findings detail
No new finding identified in checked feature surfaces. Existing asynchronous-sync data-loss window, stale overwrites, missing backup history and incomplete earlier recovery remain documented limitations, not fixed by this browser feature. No destructive live probe was performed.

## Remediation summary
No release-time code remediation required. Existing controls retained; no access bypass or storage rewrite.

## Re-evaluation
N/A: no Medium-or-above finding required a release fix. Fresh checks above and source-hash preservation completed.

## Next step
Quality review, then release-hygiene check and explicitly authorized deployment. No Git commit/push/merge authorized. Use existing Cloudflare account and Worker. Compare real R2 object inventory before/after; bucket counters alone are not evidence of song preservation.
