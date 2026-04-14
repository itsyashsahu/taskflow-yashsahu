#!/bin/bash
# Run database migrations
# Usage: ./scripts/run-migrations.sh

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-1234}"
DB_NAME="${DB_NAME:-taskflow}"

cd "$(dirname "$0")/.."
DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME" npx dbmate up

echo "Migrations complete!"