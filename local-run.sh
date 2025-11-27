#!/bin/bash
set -e

echo "Building TypeScript project..."
npm run build

echo "Starting Docker containers..."
docker-compose -f docker-compose.local.yml up -d --build

sleep 1

LOG_LEVEL=info npx dotenv -e .env npm run start:dev
