#!/bin/sh
# Restore /data from R2, then run the sync agent and the studio; SIGTERM reaches both.
set -eu
AGENT=/app/infra/cloudflare/studio-container/sync-agent.ts

if [ "${VBM_SYNC_DISABLED:-}" = "1" ]; then
  echo "sync disabled (local test only): /data is not persisted" >&2
  cd /app/apps/ttb-studio && exec bun ./build
fi

# Never start on an empty data dir when R2 is unreachable.
bun "$AGENT" restore || { echo "restore from R2 failed; refusing to start" >&2; exit 1; }

bun "$AGENT" run &
agent=$!
(cd /app/apps/ttb-studio && exec bun ./build) &
server=$!

stop() {
  kill -TERM "$server" 2>/dev/null || true
  wait "$server" 2>/dev/null || true
  kill -TERM "$agent" 2>/dev/null || true
  wait "$agent" 2>/dev/null || true
  exit 0
}
trap stop TERM INT

# If either process dies, stop the other (agent flushes on SIGTERM) and exit non-zero.
while kill -0 "$server" 2>/dev/null && kill -0 "$agent" 2>/dev/null; do sleep 2; done
kill -TERM "$server" "$agent" 2>/dev/null || true
wait 2>/dev/null || true
exit 1
