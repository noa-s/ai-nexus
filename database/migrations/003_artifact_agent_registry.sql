CREATE SCHEMA IF NOT EXISTS registry;

CREATE TABLE IF NOT EXISTS registry.artifact (
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_ref TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  business_unit TEXT,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  risk_classification TEXT,
  data_classification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artifact_type, artifact_id)
);

CREATE TABLE IF NOT EXISTS registry.artifact_version (
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  version TEXT NOT NULL,
  content JSONB NOT NULL,
  content_digest TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artifact_type, artifact_id, version),
  FOREIGN KEY (artifact_type, artifact_id)
    REFERENCES registry.artifact(artifact_type, artifact_id)
);

CREATE TABLE IF NOT EXISTS registry.agent (
  agent_id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL DEFAULT 'agent' CHECK (artifact_type = 'agent'),
  name TEXT NOT NULL,
  description TEXT,
  owner_ref TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  business_unit TEXT,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  risk_classification TEXT NOT NULL,
  data_classification TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (artifact_type, agent_id)
    REFERENCES registry.artifact(artifact_type, artifact_id),
  UNIQUE (artifact_type, agent_id)
);

CREATE TABLE IF NOT EXISTS registry.agent_version (
  agent_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'agent' CHECK (artifact_type = 'agent'),
  version TEXT NOT NULL,
  artifact_type_version TEXT NOT NULL DEFAULT 'agent',
  artifact_id_version TEXT NOT NULL,
  artifact_version TEXT NOT NULL,
  content JSONB NOT NULL,
  content_digest TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  capability_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_status JSONB,
  deployment_status JSONB,
  access_requirements JSONB,
  declaration_schema_version TEXT NOT NULL DEFAULT '1',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, version),
  FOREIGN KEY (artifact_type, agent_id)
    REFERENCES registry.artifact(artifact_type, artifact_id),
  FOREIGN KEY (artifact_type_version, artifact_id_version, artifact_version)
    REFERENCES registry.artifact_version(artifact_type, artifact_id, version),
  UNIQUE (artifact_type_version, artifact_id_version, artifact_version)
);

CREATE TABLE IF NOT EXISTS registry.agent_policy_reference (
  agent_id TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  relationship_context TEXT NOT NULL,
  PRIMARY KEY (agent_id, agent_version, policy_id, policy_version, relationship_context),
  FOREIGN KEY (agent_id, agent_version)
    REFERENCES registry.agent_version(agent_id, version),
  FOREIGN KEY (policy_id, policy_version)
    REFERENCES policy.policy_version(policy_id, version)
);

CREATE TABLE IF NOT EXISTS registry.declared_dependency (
  agent_id TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  source_artifact_type TEXT NOT NULL,
  source_artifact_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  target_artifact_type TEXT NOT NULL,
  target_artifact_id TEXT NOT NULL,
  target_version TEXT,
  target_version_constraint TEXT,
  relationship_type TEXT NOT NULL,
  consumer_owner_ref TEXT NOT NULL,
  declaration_origin TEXT NOT NULL,
  source_repository_location TEXT,
  PRIMARY KEY (agent_id, agent_version, target_artifact_type, target_artifact_id, COALESCE(target_version, ''), COALESCE(target_version_constraint, ''), relationship_type),
  FOREIGN KEY (agent_id, agent_version)
    REFERENCES registry.agent_version(agent_id, version),
  CHECK ((target_version IS NOT NULL) <> (target_version_constraint IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS artifact_version_lookup_idx
  ON registry.artifact_version (artifact_type, artifact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_version_lookup_idx
  ON registry.agent_version (agent_id, created_at DESC);

CREATE OR REPLACE FUNCTION registry.prevent_artifact_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'artifact versions are immutable';
  END IF;
  IF OLD.artifact_type IS DISTINCT FROM NEW.artifact_type
    OR OLD.artifact_id IS DISTINCT FROM NEW.artifact_id
    OR OLD.version IS DISTINCT FROM NEW.version
    OR OLD.content IS DISTINCT FROM NEW.content
    OR OLD.content_digest IS DISTINCT FROM NEW.content_digest
    OR OLD.created_by IS DISTINCT FROM NEW.created_by
    OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'artifact version identity/content is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artifact_version_immutable ON registry.artifact_version;
CREATE TRIGGER artifact_version_immutable
BEFORE UPDATE OR DELETE ON registry.artifact_version
FOR EACH ROW EXECUTE FUNCTION registry.prevent_artifact_version_mutation();

CREATE OR REPLACE FUNCTION registry.prevent_artifact_version_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'artifact versions are immutable';
END;
$$;

DROP TRIGGER IF EXISTS artifact_version_truncate_immutable ON registry.artifact_version;
CREATE TRIGGER artifact_version_truncate_immutable
BEFORE TRUNCATE ON registry.artifact_version
FOR EACH STATEMENT EXECUTE FUNCTION registry.prevent_artifact_version_truncate();

CREATE OR REPLACE FUNCTION registry.prevent_agent_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'agent versions are immutable';
  END IF;
  IF OLD.agent_id IS DISTINCT FROM NEW.agent_id
    OR OLD.version IS DISTINCT FROM NEW.version
    OR OLD.content IS DISTINCT FROM NEW.content
    OR OLD.content_digest IS DISTINCT FROM NEW.content_digest
    OR OLD.artifact_type_version IS DISTINCT FROM NEW.artifact_type_version
    OR OLD.artifact_id_version IS DISTINCT FROM NEW.artifact_id_version
    OR OLD.artifact_version IS DISTINCT FROM NEW.artifact_version
    OR OLD.created_by IS DISTINCT FROM NEW.created_by
    OR OLD.created_at IS DISTINCT FROM NEW.created_at
    OR OLD.declaration_schema_version IS DISTINCT FROM NEW.declaration_schema_version THEN
    RAISE EXCEPTION 'agent version identity/content is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_version_immutable ON registry.agent_version;
CREATE TRIGGER agent_version_immutable
BEFORE UPDATE OR DELETE ON registry.agent_version
FOR EACH ROW EXECUTE FUNCTION registry.prevent_agent_version_mutation();

CREATE OR REPLACE FUNCTION registry.prevent_agent_version_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'agent versions are immutable';
END;
$$;

DROP TRIGGER IF EXISTS agent_version_truncate_immutable ON registry.agent_version;
CREATE TRIGGER agent_version_truncate_immutable
BEFORE TRUNCATE ON registry.agent_version
FOR EACH STATEMENT EXECUTE FUNCTION registry.prevent_agent_version_truncate();

INSERT INTO platform.schema_metadata (key, value)
VALUES ('migration_version', '003')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
