#!/usr/bin/env bash
# Stop the Amana local dev stack started by ./dev-local.sh
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for name in web backend; do
  pid_file="$ROOT/.localdev/$name.pid"
  [ -f "$pid_file" ] && kill "$(cat "$pid_file")" 2>/dev/null && echo "stopped $name" && rm -f "$pid_file"
done
# belt-and-braces
pkill -f "amana/backend.*src/index.js" 2>/dev/null || true
pkill -f "next dev -p 3001" 2>/dev/null || true

"$ROOT/.localdev/pgsql/bin/pg_ctl" -D "$ROOT/.localdev/pgdata" stop -m fast 2>/dev/null && echo "stopped postgres" || true
