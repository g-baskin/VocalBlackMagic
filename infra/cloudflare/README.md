# VBM Studio on Cloudflare

TTB Studio runs entirely on Cloudflare; nothing runs on your Mac.

```
phone/browser ──► Worker `vbm-studio` (Cloudflare Access login + owner email check)
                    └─► Container `StudioContainer` (one instance, "owner"): Bun + ffmpeg, studio production build
                          └─ /data ◄─sync agent─► http://r2.vbm ─(Worker outbound handler)─► R2 bucket `vbm-studio-data` (prefix data/)
```

- **Worker** (`studio-edge/src/worker.ts`, `index.ts`, `access.ts`): verifies the Cloudflare Access JWT (fail closed: 503 until `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `OWNER_EMAILS` and `EDGE_SECRET` are set), drops spoofable headers and forwards to the container with `x-vbm-edge-auth: EDGE_SECRET`. The studio refuses paid and studio routes without that header (owner mode).
- **Single owner only:** this is not multi-user accounts. There is no tenant isolation, billing or spend cap, and every paid action costs money on your provider accounts.
- **Container** (`studio-container/Dockerfile`, `entrypoint.sh`): `standard-1`, max 1 instance, sleeps after 15 minutes idle. Its environment is `NODE_ENV=production`, `HOST`, `PORT=3002`, `VBM_DATA_DIR=/data`, the ffmpeg paths, `VBM_OWNER_MODE=1`, `VBM_EDGE_SECRET`, `VBM_SYNC_URL`, `PROTOCOL_HEADER` (needed for SvelteKit's CSRF origin check), `BODY_SIZE_LIMIT=110M`, plus any provider keys that are set as Worker secrets.
- **Persistence** (`studio-edge/src/r2-store.ts`, `studio-container/sync-agent.ts`): on start the entrypoint restores R2 to `/data` and refuses to start if R2 is unreachable. While running, the agent pushes changes and deletions to R2 and flushes on shutdown. The container's disk is temporary; R2 is the real store.

## What you still need to do

1. **Turn on Cloudflare Access.** In the dashboard go to Workers & Pages → `vbm-studio` → Settings → Domains & Routes → `workers.dev` → enable Cloudflare Access. Send back the **team domain** (e.g. `yourteam.cloudflareaccess.com`) and the **AUD** tag. They go into `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` in `studio-edge/wrangler.jsonc`, then redeploy with `bun run edge:deploy`. Until then every visitor gets 503.
2. **Add provider keys** you want to use, each one:
   `cd infra/cloudflare/studio-edge && bunx wrangler@4.158.0 secret put REPLICATE_API_TOKEN`
   (likewise `FAL_KEY`, `GEMINI_API_KEY`, `MINIMAX_API_KEY`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). A missing key answers 503 for that feature. A running container picks up new keys the next time it starts.

`EDGE_SECRET` is already set. To rotate it, run `openssl rand -hex 32` and pipe it into `wrangler secret put EDGE_SECRET`.

## Limits

- **Uploads:** at most 100 MB per request (Cloudflare's Free/Pro cap). The Upload page stops files over 95 MB with a clear message.
- **Cold start:** after 15 minutes idle the container sleeps. The first request after that waits for it to boot and restore `/data` from R2, which takes longer as the library grows.
- **Data-loss window:** files are safe only once the sync agent has pushed them. A crash or forced kill can lose changes made just before it. Normal sleep and shutdown flush first.
- One instance only: there is no concurrent scaling, by design.

## Cost (rough)

Containers are billed per 10 ms while awake, beyond what Workers Paid includes each month: 25 GiB-hours of memory, 375 vCPU-minutes and 200 GB-hours of disk. A sleeping container costs nothing for compute. R2 storage and operations are billed separately, and a light personal workload stays within or near the free tiers. Prices: https://developers.cloudflare.com/containers/pricing/

## Development

- `bun run check:edge` typechecks the Worker; `bun test infra/cloudflare` runs the Worker, R2 store and sync agent tests.
- Run the image locally without R2: `docker build --platform linux/amd64 -f infra/cloudflare/studio-container/Dockerfile -t vbm-studio:local .`, then `docker run -e VBM_SYNC_DISABLED=1 -e VBM_OWNER_MODE=1 -e VBM_EDGE_SECRET=... -p 13002:3002 vbm-studio:local`. Nothing is persisted in that mode.
