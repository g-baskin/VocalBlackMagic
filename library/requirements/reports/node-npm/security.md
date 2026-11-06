# Node/npm migration security review

Scope: uncommitted feature/node-npm diff against main dc28cd0. Performed by the coding agent, not an independent auditor. Reduced coverage: Node/systemd deployment, not the skill's Vercel/WorkOS stack. Not public-launch approval.

## Checked
- Application, Python, authentication and storage source unchanged (git diff --quiet for those paths).
- tests/production.test.mjs:7 exercises both built Node handlers on loopback: pages and health respond; generation, upload, reference reads and deletion return application authorization errors with status 403. Same-origin requests reach the guards without disabling CSRF.
- infra/systemd/vbm-vocal-fix.service:10 and vbm-ttb-studio.service:10 retain production NODE_ENV, loopback HOST and service sandboxing. Only executable changed.
- .github/workflows/ci.yml:17 uses npm ci, read-only repository permission and ordinary pull_request events, not pull_request_target. No deployment or secrets added.
- package-lock.json: all non-workspace resolved URLs use registry.npmjs.org and SHA-512 integrity. The adapter is pinned to 6.0.1; clean npm ci passed.
- npm audit --audit-level=moderate passed with zero moderate/high/critical findings.

## Low finding
- package-lock.json, node_modules/deepmerge entry: npm reports GHSA-gcqx-w48m-w2h4 through the Svelte build plugin, propagated to four dependency entries. No compatible fix was offered; the suggested force fix would downgrade SvelteKit to 0.0.30. Left unchanged rather than break the framework. This is a dependency finding, not proof of application exploitability.

## Not checked
- Public deployment, real authentication/tenancy, GPU inference and model licensing remain unimplemented and outside this migration.
- Registry signature verification, full historical secret scan and a deployed reverse proxy were not tested.

Result: no medium-or-higher migration findings. Existing public-launch restrictions remain mandatory.
