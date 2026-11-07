---
type: question
title: "Are the /api/references proxy routes dead code?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - vocal-fix
related:
  - "[[entities/route-vf-post-references]]"
  - "[[entities/route-vf-get-reference]]"
  - "[[entities/route-vf-delete-reference]]"
  - "[[entities/mod-vocal-fix-backend]]"
---

# Are the /api/references proxy routes dead code?

The three reference routes still proxy to the Python prototype through `backend.ts` (`apps/vocal-fix/src/routes/api/references/+server.ts:41-53`), but no page in `apps/vocal-fix/src` calls them; intake uses `/api/sessions` (`apps/vocal-fix/src/routes/+page.svelte:77`). Should they be removed or kept for the prototype?

## Related

- [[entities/route-vf-post-references]]
- [[entities/route-vf-get-reference]]
- [[entities/route-vf-delete-reference]]
- [[entities/mod-vocal-fix-backend]]
