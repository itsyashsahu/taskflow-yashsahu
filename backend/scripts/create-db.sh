#!/bin/bash
# Create taskflow database and run migrations
# Usage: ./scripts/create-db.sh

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-1234}"
DB_NAME="${DB_NAME:-taskflow}"

echo "Checking PostgreSQL..."
if ! docker ps | grep -q postgres; then
  echo "Error: No postgres container running"
  exit 1
fi

echo "Creating database '$DB_NAME'..."
docker exec mono-postgres-1 psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

echo "Running migrations..."
cd "$(dirname "$0")/.."
DATABASE_URL="postgres://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME" npx dbmate up

echo "Running seed data..."
docker cp db/seed.sql mono-postgres-1:/tmp/seed.sql 2>/dev/null || true
docker exec mono-postgres-1 psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed.sql 2>/dev/null || echo "No seed file"

echo "Done!"