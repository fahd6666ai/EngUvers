#!/bin/sh
set -e

echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Applying migrations..."
pnpm exec prisma migrate deploy

echo "Seeding reference data..."
pnpm exec prisma db seed

echo "Starting API in watch mode..."
exec pnpm dev
