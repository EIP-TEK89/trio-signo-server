#!/bin/sh
set -e

echo "⏳  Waiting for Postgres at ${DATABASE_URL##*@}..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-user}"; do
  sleep 1
done

echo "✅  Postgres is up — running migrations…"
npx prisma migrate deploy

# (optional) run your seed script if you have one:
# echo "🧱  Seeding…"
# npm run seed

echo "🚀  Starting Nest in dev mode…"
exec npm run start:dev
