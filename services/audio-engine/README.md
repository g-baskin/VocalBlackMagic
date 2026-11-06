# Audio engine / GPU worker boundary

**This is the planned extraction point, not a deployed worker.**

Retained prototype Python FastAPI apps:
- `apps/vocal_fix/app.py` — source upload and reference-session metadata.
- `apps/ttb_studio/app.py` — generation request validation and unavailable-engine response.

Future work:
- Move audio model adapters here without entangling the SvelteKit product lifecycles.
- Create typed job protocol with server-issued tenant and asset authorization.
- On-demand GPU process, model caching, persistence, retry/cancel, immutable originals and non-destructive Premium Studio versions.
- Avoid always-on GPU allocation for idle SaaS sessions.
- No model weights or voices in this repository.
