# Security audit - 2026-11-08 - mastering selectors

## Executive summary
- Scope: eight mastering implementation/test files, immediate request guard, owner-mode gate, file-backed song library, and existing Cloudflare deployment boundary. Candidate: local changes over bbb07d5 on feature/bm-suno.
- Coverage: REDUCED COVERAGE. SvelteKit application review plus project-specific source/tests; Cloudflare Containers/R2 and ffmpeg are outside this skill's researched platform stack. No whole-repository certification or live authenticated penetration test.
- Findings introduced by this change: 0 Critical, 0 High, 0 Medium, 0 Low.
- Ship Gate status: cleared to proceed to quality-stinger for this owner-only increment.

## Surface coverage checklist
### SvelteKit attack surface
None detected in the changed surface. CODE: master/+server.ts runs guard(request, true) before body parsing, context creation or writes. masterPresetRequest accepts only an object with an optional allowlisted preset; malformed JSON becomes an invalid body. Native text rendering, no raw HTML. No new form actions, cookies, CSP or framework config changes.

### Authorization and tenancy (Drizzle / Neon)
Not applicable: no database or multi-tenant feature. CODE: context.ts and music/gate.ts retain production denial without the owner edge secret; foreign dev hosts and non-JSON writes remain blocked. The single owner can process their shared private library. No assertion of multi-user isolation.

### Secrets and environment
None detected in scanned app source. RUNTIME: `gitleaks dir apps/ttb-studio/src --redact --no-banner` passed. CODE: no new environment variables or client credential imports; .dockerignore excludes .env variants, data, .git and build artifacts. Cloud provider secret inventory/history and GitHub organization settings were not rescanned.

### Webhooks and third-party intake
Not applicable: no webhook, outbound provider call or user-supplied URL added. CODE: preset names map to fixed authored ffmpeg filter strings and argv arrays, never a shell command or arbitrary filter. Song UUID/metadata resolve the source through the existing SongLibrary.

### Dependencies and supply chain
None detected in this delta: no dependency, lockfile, CI or Dockerfile changes. Existing Docker build uses frozen lockfile. Registry advisory coverage and baseline CI install policy were not re-audited in this bounded pass.

### Headers and transport
None detected in changed handler: success remains no-store; existing JSON intent and owner/host gates retained. RUNTIME: edge authorization/routing tests passed. Live Access redirect will be checked after deployment; signed-in cloud flow remains an owner check.

### AI-generated code patterns
None detected in reviewed delta. CODE: server validates the actual preset instead of trusting the client type; matching measurement/render chains; validation precedes storage reservation; derive.ts creates a fresh UUID child and removes only that child on failure. No added credentials, packages or fake successful output.

### PII and logging hygiene
None detected in this delta: no new logs or telemetry. Existing ffmpeg failure stderr logging and owner-only storage remain unchanged; no claim of a full PII audit.

## Findings detail
No new actionable security findings in the bounded change. Existing limitations: synchronous mastering has a per-process timeout but no global mastering concurrency queue; private disk metadata is trusted and SongLibrary does not defend against a privileged local writer replacing files with symlinks. Neither boundary is expanded by the presets. These are not a basis for public multi-user deployment.

## Remediation summary
| Severity | Count | Fixed this session | Documented only |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 0 | 0 | 0 |
| Low | 0 | 0 | 0 |

## Re-evaluation
N/A: no Medium-or-above findings required fixes. RUNTIME: 26 focused route, edge and preset tests passed. Earlier 373-test run and browser validation include source preservation, real synthetic render and invalid request rejection. No user's song or paid model was processed during this pass.

## Eight-preset follow-up review
User approved publishing Deep Bass, Smooth, Presence and Dynamic. Reviewed the four-file addition after the first deployment: static labels/IDs, fixed server filter chains and expanded tests only. Existing four chains, validation boundary, guarded endpoint, source preservation and storage behavior remain unchanged. No new medium-or-higher finding. No remediation required. Fresh source gitleaks scan passed; 27 focused preset, request-guard and edge tests passed (349 assertions). Original reduced-coverage and unverified-platform limits above still apply. This addendum precedes the final follow-up Quality review.

## Next step
Proceed to quality-stinger. Deployment is authorized by the user's "Push online" request. No merge, rebase or source publication is performed by this report.
