#!/bin/sh
# Restore /data from R2, then run the sync agent, the studio and Vocal Fix; SIGTERM reaches all.
set -eu
AGENT=/app/infra/cloudflare/studio-container/sync-agent.ts

if [ "${VBM_SYNC_DISABLED:-}" = "1" ]; then
  echo "sync disabled (local test only): /data is not persisted" >&2
  (cd /app/apps/vocal-fix && PORT="${VOCAL_FIX_PORT:-3001}" exec bun ./build) &
  cd /app/apps/ttb-studio && exec bun ./build
fi

# Never start on an empty data dir when R2 is unreachable.
bun "$AGENT" restore || { echo "restore from R2 failed; refusing to start" >&2; exit 1; }

bun "$AGENT" run &
agent=$!
(cd /app/apps/ttb-studio && exec bun ./build) &
server=$!
(cd /app/apps/vocal-fix && PORT="${VOCAL_FIX_PORT:-3001}" exec bun ./build) &
vocal=$!

stop() {
  kill -TERM "$server" "$vocal" 2>/dev/null || true
  wait "$server" 2>/dev/null || true
  wait "$vocal" 2>/dev/null || true
  kill -TERM "$agent" 2>/dev/null || true
  wait "$agent" 2>/dev/null || true
  exit 0
}
trap stop TERM INT

# If any process dies, stop the others (agent last: it flushes on SIGTERM) and exit non-zero.
while kill -0 "$server" 2>/dev/null && kill -0 "$vocal" 2>/dev/null && kill -0 "$agent" 2>/dev/null; do sleep 2; done
kill -TERM "$server" "$vocal" 2>/dev/null || true
wait "$server" 2>/dev/null || true
wait "$vocal" 2>/dev/null || true
kill -TERM "$agent" 2>/dev/null || true
wait 2>/dev/null || true
exit 1
