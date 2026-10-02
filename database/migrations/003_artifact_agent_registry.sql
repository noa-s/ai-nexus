CREATE SCHEMA IF NOT EXISTS registry;

CREATE TABLE IF NOT EXISTS registry.artifact (
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('agent', 'prompt', 'policy', 'knowledge', 'tool', 'model-capability', 'evaluation-suite', 'platform-component')),
  artifact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  business_unit TEXT,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
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
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artifact_type, artifact_id, version),
  FOREIGN KEY (artifact_type, artifact_id) REFERENCES registry.artifact(artifact_type, artifact_id)
);

CREATE TABLE IF NOT EXISTS registry.agent (
  agent_id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL DEFAULT 'agent' CHECK (artifact_type = 'agent'),
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  business_unit TEXT,
  risk_classification TEXT NOT NULL,
  data_classification TEXT NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (artifact_type, agent_id) REFERENCES registry.artifact(artifact_type, artifact_id)
);

CREATE TABLE IF NOT EXISTS registry.agent_version (
  agent_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'agent' CHECK (artifact_type = 'agent'),
  version TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('DRAFT', 'VALIDATING', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  declared_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  declared_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_capability_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_configuration_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_status_reference TEXT,
  deployment_status TEXT NOT NULL DEFAULT 'UNDEPLOYED',
  access_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (agent_id, version),
  FOREIGN KEY (artifact_type, agent_id, version) REFERENCES registry.artifact_version(artifact_type, artifact_id, version)
);

CREATE TABLE IF NOT EXISTS registry.agent_policy_reference (
  agent_id TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  relationship TEXT NOT NULL,
  context TEXT NOT NULL,
  PRIMARY KEY (agent_id, agent_version, policy_id, policy_version, relationship, context),
  FOREIGN KEY (agent_id, agent_version) REFERENCES registry.agent_version(agent_id, version),
  FOREIGN KEY (policy_id, policy_version) REFERENCES policy.policy_version(policy_id, version)
);

CREATE TABLE IF NOT EXISTS registry.declared_dependency (
  source_artifact_type TEXT NOT NULL,
  source_artifact_id TEXT NOT NULL,
  source_version TEXT NOT NULL,
  target_artifact_type TEXT NOT NULL CHECK (target_artifact_type IN ('agent', 'prompt', 'policy', 'knowledge', 'tool', 'model-capability', 'evaluation-suite', 'platform-component')),
  target_artifact_id TEXT NOT NULL,
  target_version TEXT,
  target_version_constraint TEXT,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('runtime', 'governance')),
  consumer_owner_reference TEXT NOT NULL,
  declaration_origin TEXT NOT NULL,
  source_repository_location TEXT,
  PRIMARY KEY (source_artifact_type, source_artifact_id, source_version, target_artifact_type, target_artifact_id, relationship_type, declaration_origin),
  CHECK ((target_version IS NOT NULL) <> (target_version_constraint IS NOT NULL)),
  FOREIGN KEY (source_artifact_type, source_artifact_id, source_version) REFERENCES registry.artifact_version(artifact_type, artifact_id, version)
);

CREATE OR REPLACE FUNCTION registry.prevent_immutable_version_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'artifact versions are immutable'; END IF;
  IF OLD.artifact_type IS DISTINCT FROM NEW.artifact_type OR OLD.artifact_id IS DISTINCT FROM NEW.artifact_id OR OLD.version IS DISTINCT FROM NEW.version OR OLD.content IS DISTINCT FROM NEW.content OR OLD.content_digest IS DISTINCT FROM NEW.content_digest OR OLD.created_by IS DISTINCT FROM NEW.created_by OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'artifact version identity/content is immutable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS artifact_version_immutable ON registry.artifact_version;
CREATE TRIGGER artifact_version_immutable BEFORE UPDATE OR DELETE ON registry.artifact_version FOR EACH ROW EXECUTE FUNCTION registry.prevent_immutable_version_mutation();

CREATE OR REPLACE FUNCTION registry.prevent_immutable_version_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'artifact versions are immutable'; END; $$;
DROP TRIGGER IF EXISTS artifact_version_truncate_immutable ON registry.artifact_version;
CREATE TRIGGER artifact_version_truncate_immutable BEFORE TRUNCATE ON registry.artifact_version FOR EACH STATEMENT EXECUTE FUNCTION registry.prevent_immutable_version_truncate();

CREATE OR REPLACE FUNCTION registry.prevent_agent_version_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'agent versions are immutable'; END IF;
  IF OLD.agent_id IS DISTINCT FROM NEW.agent_id OR OLD.artifact_type IS DISTINCT FROM NEW.artifact_type OR OLD.version IS DISTINCT FROM NEW.version OR OLD.declared_capabilities IS DISTINCT FROM NEW.declared_capabilities OR OLD.declared_tasks IS DISTINCT FROM NEW.declared_tasks OR OLD.model_capability_references IS DISTINCT FROM NEW.model_capability_references OR OLD.tool_references IS DISTINCT FROM NEW.tool_references OR OLD.knowledge_configuration_references IS DISTINCT FROM NEW.knowledge_configuration_references OR OLD.evaluation_status_reference IS DISTINCT FROM NEW.evaluation_status_reference OR OLD.deployment_status IS DISTINCT FROM NEW.deployment_status OR OLD.access_requirements IS DISTINCT FROM NEW.access_requirements OR OLD.created_by IS DISTINCT FROM NEW.created_by OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'agent version content is immutable';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS agent_version_immutable ON registry.agent_version;
CREATE TRIGGER agent_version_immutable BEFORE UPDATE OR DELETE ON registry.agent_version FOR EACH ROW EXECUTE FUNCTION registry.prevent_agent_version_mutation();

CREATE OR REPLACE FUNCTION registry.prevent_agent_version_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'agent versions are immutable'; END; $$;
DROP TRIGGER IF EXISTS agent_version_truncate_immutable ON registry.agent_version;
CREATE TRIGGER agent_version_truncate_immutable BEFORE TRUNCATE ON registry.agent_version FOR EACH STATEMENT EXECUTE FUNCTION registry.prevent_agent_version_truncate();

INSERT INTO platform.schema_metadata (key, value) VALUES ('migration_version', '003') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
