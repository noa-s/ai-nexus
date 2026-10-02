CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE IF NOT EXISTS platform.schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform.schema_metadata (key, value)
VALUES ('migration_version', '001')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
