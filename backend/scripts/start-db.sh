#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load environment variables from .env.local
if [ -f "env/.env.local" ]; then
  set -a
  source env/.env.local
  set +a
fi

# Parse DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
  DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*://[^@]*@\([^:]*\):.*|\1|p')
  PORT=$(echo $DATABASE_URL | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
fi

CONTAINER_NAME="taskflow-dev-postgres"

cleanup() {
  echo ""
  echo "Stopping PostgreSQL container..."
  docker rm -f $CONTAINER_NAME 2>/dev/null
  echo "PostgreSQL container stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting PostgreSQL container..."

# Stop and remove existing container if exists
docker rm -f $CONTAINER_NAME 2>/dev/null

# Run PostgreSQL container
docker run -d \
  --name $CONTAINER_NAME \
  -e POSTGRES_PASSWORD=$DB_PASSWORD \
  -e POSTGRES_USER=$DB_USER \
  -e POSTGRES_DB=$DB_NAME \
  -p $PORT:5432 \
  postgres:16-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec $CONTAINER_NAME pg_isready -U $DB_USER >/dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  sleep 1
done

# Run migrations
echo "Running migrations..."
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@localhost:$PORT/$DB_NAME" npx dbmate up

# Run seed
echo "Running seed..."
docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < db/seed.sql

echo "PostgreSQL is running on port $PORT with database '$DB_NAME'"
echo "Press Ctrl+C to stop..."

# Wait indefinitely
wait