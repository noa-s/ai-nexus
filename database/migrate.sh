#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

for migration in database/migrations/*.sql; do
  echo "Applying ${migration}"
  psql "${DATABASE_URL}" --set ON_ERROR_STOP=1 --file "${migration}"
done
