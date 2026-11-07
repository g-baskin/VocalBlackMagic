---
type: question
title: "What creates the first Gold Vocal?"
status: developing
created: "2026-11-06"
updated: "2026-11-06"
tags:
  - question
  - vocal-fix
related:
  - "[[entities/route-vf-page-session-id-gold]]"
  - "[[entities/route-vf-post-sessions-id-gold]]"
  - "[[concepts/gold-vocal]]"
---

# What creates the first Gold Vocal?

Only the gold board POSTs `/api/sessions/<id>/gold`, inside `reassemble`, which returns early when no gold exists (`apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:146-147`, `apps/vocal-fix/src/routes/session/[id]/gold/+page.svelte:165`). No other caller was found in `apps/vocal-fix/src`. Is first assembly missing from the UI, or done elsewhere?

## Related

- [[entities/route-vf-page-session-id-gold]]
- [[entities/route-vf-post-sessions-id-gold]]
- [[concepts/gold-vocal]]
