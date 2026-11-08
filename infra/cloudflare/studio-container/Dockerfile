# VBM Studio container: production build of apps/ttb-studio on Bun with ffmpeg.
# Build context is the repository root (see studio-edge/wrangler.jsonc).
FROM --platform=linux/amd64 oven/bun:1.4.0-debian AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile && bun run build:ttb

FROM --platform=linux/amd64 oven/bun:1.4.0-debian
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data && chown bun:bun /data
WORKDIR /app
COPY --from=build --chown=bun:bun /app /app
USER bun
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3002 VBM_DATA_DIR=/data
EXPOSE 3002
ENTRYPOINT ["/app/infra/cloudflare/studio-container/entrypoint.sh"]
