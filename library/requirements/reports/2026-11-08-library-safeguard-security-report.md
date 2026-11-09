# Library deletion safeguard: Security review

Scope: emergency containment of implicit cloud deletion in owner-only VBM Studio, approved by the owner after the empty Library incident. Candidate: existing feature/bm-suno worktree; preserve all eight-preset work. Reduced coverage: code/isolated execution, not a comprehensive Cloudflare, provider, tenant or filesystem audit.

## Threat and control
- CODE: sync-agent.ts no longer plans deletes from local absence, and the DELETE HTTP sender/execution loop has been removed. Plan/result deletion fields remain empty/zero for compatibility. Both normal cycles and shutdown flush share this behavior.
- CODE: r2-store.ts refuses every DELETE with 403 without calling the bucket. R2Like no longer exposes a delete method. This protects the storage boundary against calls from an older agent once that boundary is running the updated Worker.
- CODE: the Studio song DELETE handler keeps its existing guard first, then rejects owner-mode deletion with 503/no-store before accessing storage. Development-only deletion behavior remains unchanged. Existing UI error handling displays the failure and does not remove the song from its list.
- CODE: existing authentication, owner checks, host/JSON constraints, upload code and no-store responses are retained. No new dependency, secret, public route or dynamic command.

## Findings and verification
The reproduced implicit-deletion hazard is addressed within this patch. No additional medium-or-higher finding in the bounded delta. No claim that the exact historical incident trigger has been proven.

RUNTIME: tests first failed at five assertions against the old implementation: local-removal propagation, partial scan, shutdown flush, storage-handler DELETE, hosted app DELETE. After the fix, 34 focused infrastructure and route tests pass (355 assertions). In-memory storage and newly created temporary fixture directories only; no live deletion probes or user audio. Existing restore/download-failure tests pass.

RUNTIME: check:edge and source gitleaks scan of infra/cloudflare pass. Built-in editor diagnostics about Bun types are baseline editor-context warnings; actual Bun tests and project type check are authoritative for this scope. App checks follow in final Quality.

## Limits / residual risks
This is deletion containment, not backup/versioning. Uploads may still overwrite same-key files, asynchronous upload can lose unsynced data on crash, privileged account administrators can act directly on R2, and an old Worker version may have in-flight work during rollout. No restoration should occur until the rollout is confirmed and exact recovery targets approved. Read-only inventory must be compared before/after deployment. Signed-in live behavior and provider audio recovery remain unverified. No production destructive request is permitted as a test.

## Next
Final Quality review, then repo-health/base checks and the authorized safeguard deployment. Recovery remains read-only; no reset, reseed, regeneration or overwrite authorized.
