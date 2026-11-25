#!/bin/bash
# Compose DATABASE_URL from DB_* vars, write to prisma/.env for Prisma CLI
# Supports multi-host failover (e.g. DB_HOST=172.16.30.4,10.9.0.2) and DB_OPTIONS (e.g. --target_session_attrs=read-write)
# Usage: ./scripts/with-db-url.sh bunx prisma migrate dev

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Compose URL using shared db-config helper (handles multi-host failover and DB_OPTIONS)
DB_URL=$(cd "$PROJECT_ROOT" && bun -e "
  import { composeDatabaseUrl } from './src/lib/db-config';
  const url = composeDatabaseUrl(process.env, { forPrisma: true });
  if (url) console.log(url);
" 2>/dev/null | grep -E '^postgresql://' | tail -n 1)

# Validate
if [[ "$DB_URL" != postgresql://* ]]; then
  echo "❌ Failed to compose DATABASE_URL"
  echo "   Parsed: '$DB_URL'"
  echo "   Check DB_USER, DB_PASS, DB_NAME in $ENV_FILE"
  exit 1
fi

# Write to prisma/.env (Prisma CLI reads this with highest priority)
cleanup() { rm -f "$PROJECT_ROOT/prisma/.env"; }
trap cleanup EXIT
echo "DATABASE_URL=\"$DB_URL\"" > "$PROJECT_ROOT/prisma/.env"

# Also export it so child processes get it directly
export DATABASE_URL="$DB_URL"

cd "$PROJECT_ROOT"
"$@"
