#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Amana — local offline dev stack (stubbed external services).
# Starts: bundled Postgres 16  →  backend API (:3000)  →  web app (:3001)
#
# Prereqs: Node 20 on PATH (nvm use 20). First run only:
#   (cd backend && npm install) && (cd web && npm install)
#   (cd backend && node -r dotenv/config prisma/seed.js)   # if DB is empty
#
# Stop everything:  ./dev-stop.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGSQL="$ROOT/.localdev/pgsql/bin"
PGDATA="$ROOT/.localdev/pgdata"
SOCK=/tmp/amana-pgsock
mkdir -p "$SOCK"

echo "▶ Postgres…"
if "$PGSQL/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  echo "  already running"
else
  "$PGSQL/pg_ctl" -D "$PGDATA" \
    -o "-p 5433 -c listen_addresses=127.0.0.1 -c unix_socket_directories=$SOCK" \
    -l "$ROOT/.localdev/pg.log" -w start
fi

echo "▶ Backend API on :3000…"
( cd "$ROOT/backend" && npm start > "$ROOT/.localdev/backend.log" 2>&1 & echo $! > "$ROOT/.localdev/backend.pid" )

echo "▶ Web app on :3001…"
( cd "$ROOT/web" && npm run dev > "$ROOT/.localdev/web.log" 2>&1 & echo $! > "$ROOT/.localdev/web.pid" )

sleep 4
echo
echo "✅ Up:"
echo "   Web      http://localhost:3001"
echo "   API      http://localhost:3000/health"
echo "   Logs     .localdev/{backend,web,pg}.log"
echo
echo "   Log in with any seeded phone + password amana1234, then SMS code 123456:"
echo "     sender_1 … sender_5     +10000000001 … +10000000005"
echo "     traveler_1 … traveler_5 +10000000011 … +10000000015"
