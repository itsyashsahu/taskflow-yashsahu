#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORTS=(5432 3001 5173)

echo "Checking required ports: ${PORTS[*]}"
for port in "${PORTS[@]}"; do
  pids="$(lsof -ti tcp:"$port" || true)"
  if [[ -n "$pids" ]]; then
    echo "Port $port is busy. Stopping process(es): $pids"
    kill -9 $pids || true
  fi
done

echo "Starting TaskFlow with Docker Compose..."
docker compose up --build "$@"
