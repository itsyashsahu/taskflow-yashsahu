#!/bin/bash

CONTAINER_NAME="taskflow-dev-postgres"

echo "Stopping PostgreSQL container..."
docker rm -f $CONTAINER_NAME 2>/dev/null
echo "PostgreSQL container stopped."