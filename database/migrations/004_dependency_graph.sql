CREATE SCHEMA IF NOT EXISTS dependency;

CREATE TABLE IF NOT EXISTS dependency.graph_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  repository TEXT NOT NULL,
  revision TEXT NOT NULL,
  analyzer_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dependency.dependency_edge (
  snapshot_id TEXT NOT NULL REFERENCES dependency.graph_snapshot(snapshot_id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,
  source_artifact_type TEXT NOT NULL,
  source_artifact_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  target_artifact_type TEXT NOT NULL,
  target_artifact_id TEXT NOT NULL,
  target_version TEXT,
  target_version_constraint TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('runtime', 'governance')),
  consumer_owner_reference TEXT NOT NULL,
  declaration_origin TEXT NOT NULL,
  source_repository_location TEXT,
  analyzer_version TEXT NOT NULL,
  tenant_id TEXT,
  PRIMARY KEY (snapshot_id, edge_id),
  CHECK ((target_version IS NOT NULL) <> (target_version_constraint IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS dependency_edge_target_idx
  ON dependency.dependency_edge (target_artifact_type, target_artifact_id, target_version);
CREATE INDEX IF NOT EXISTS dependency_edge_source_idx
  ON dependency.dependency_edge (source_artifact_type, source_artifact_id, source_version);
CREATE INDEX IF NOT EXISTS dependency_snapshot_repository_idx
  ON dependency.graph_snapshot (repository, created_at DESC);

CREATE TABLE IF NOT EXISTS dependency.analyzer_finding (
  finding_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES dependency.graph_snapshot(snapshot_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'BLOCKING')),
  message TEXT NOT NULL,
  repository_path TEXT,
  line INTEGER,
  column INTEGER,
  artifact JSONB,
  dependency JSONB
);

CREATE INDEX IF NOT EXISTS analyzer_finding_snapshot_idx
  ON dependency.analyzer_finding (snapshot_id, severity);

INSERT INTO platform.schema_metadata (key, value)
VALUES ('migration_version', '004')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
