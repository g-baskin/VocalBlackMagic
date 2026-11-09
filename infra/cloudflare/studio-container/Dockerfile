# VBM Studio container: production builds of apps/ttb-studio (port 3002) and apps/vocal-fix
# (port 3001, served under /vocal-fix by the edge Worker) on Bun with ffmpeg.
# Build context is the repository root (see studio-edge/wrangler.jsonc).
FROM --platform=linux/amd64 oven/bun:1.4.0-debian AS build
WORKDIR /app
COPY . .
# Sister-app links are build-time (VITE_*). Vocal Fix is built with base path /vocal-fix.
RUN bun install --frozen-lockfile \
  && VITE_VOCAL_FIX_URL=/vocal-fix bun run build:ttb \
  && VITE_VBM_BASE=/vocal-fix VITE_TTB_STUDIO_URL=/ bun run build:vocal

FROM --platform=linux/amd64 oven/bun:1.4.0-debian
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data && chown bun:bun /data
WORKDIR /app
COPY --from=build --chown=bun:bun /app /app
USER bun
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3002 VBM_DATA_DIR=/data
EXPOSE 3001 3002
ENTRYPOINT ["/app/infra/cloudflare/studio-container/entrypoint.sh"]
