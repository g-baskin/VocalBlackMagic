# Migration repository gate

Data collection: local clone only, plus git ls-remote for base freshness. Scope is the Node/npm migration, not a whole-repository hygiene audit. Coding-agent self-review, after security and quality.

- CI and docs: .github/workflows/ci.yml includes npm ci, contract tests, Svelte checks, both builds and production smoke tests. README.md and docs/RELEASING.md use npm and Node. Hosted CI has not run for this candidate.
- Ignore coverage: .gitignore excludes node_modules and both apps' generated build directories; verified with git check-ignore. No source audio or credentials introduced.
- Base: main is the intended integration branch. Live origin main, local main and feature starting HEAD all match dc28cd0942fb0afd9f591407c72ccdfbb03bf93f. There is no target divergence to conflict with the uncommitted patch at review time. Recheck on authorized shipment.
- Original main checkout's .gg/ and the other dashboard worktree were left alone.
- Branch protection, repository settings, enforced ownership, commit quality and issue/PR templates are not assessed in this scoped gate. No overall repository score or public-readiness verdict is given.
- No settings modified, commits created, remote writes or deployments performed.

No migration-specific repository blockers identified. Ignored worktree artifacts are generated dependencies/builds/test caches, not irreplaceable user data.
