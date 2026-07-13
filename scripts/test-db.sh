#!/usr/bin/env bash
# Spin up the disposable test Postgres, apply migrations, seed the curriculum.
# Idempotent — safe to run repeatedly. Never touches .env.local databases.
set -euo pipefail
cd "$(dirname "$0")/.."

docker compose -f docker-compose.test.yml up -d --wait

# Export test env BEFORE any prisma command: dotenv (used by prisma.config.ts
# to load .env.local) never overrides variables that are already set.
set -a
source .env.test
set +a

npx prisma migrate deploy
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

echo "Test DB ready on localhost:54329"
