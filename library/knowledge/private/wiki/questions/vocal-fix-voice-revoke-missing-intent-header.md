---
type: question
title: "Does revoking a voice from the Codex always fail with 415?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - vocal-fix
related:
  - "[[entities/route-vf-page-voices]]"
  - "[[entities/route-vf-delete-voices-voice-id]]"
  - "[[concepts/vocal-fix-mutation-guard]]"
---

# Does revoking a voice from the Codex always fail with 415?

The Codex page sends `DELETE /api/voices/<id>` with no headers (`apps/vocal-fix/src/routes/voices/+page.svelte:54`). The route calls `guardMutation(request, { json: false })`, which returns 415 without `x-vbm-intent` (`apps/vocal-fix/src/routes/api/voices/[voice_id]/+server.ts:7-8`, `apps/vocal-fix/src/lib/server/gate.ts:38-42`). The page also reads `.error` while the server sends `detail` (`apps/vocal-fix/src/routes/voices/+page.svelte:56`, `apps/vocal-fix/src/lib/server/errors.ts:13`). Not run in a browser; a human should confirm.

## Related

- [[entities/route-vf-page-voices]]
- [[entities/route-vf-delete-voices-voice-id]]
- [[concepts/vocal-fix-mutation-guard]]
