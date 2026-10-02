CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS authorization;
CREATE SCHEMA IF NOT EXISTS policy;

CREATE TABLE IF NOT EXISTS identity.principal (
  principal_id TEXT PRIMARY KEY,
  principal_type TEXT NOT NULL CHECK (principal_type IN ('human', 'workload')),
  tenant_id TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity.workload (
  workload_id TEXT PRIMARY KEY,
  tenant_id TEXT,
  service_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authorization.role (
  role_name TEXT PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authorization.permission (
  permission_id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authorization.role_permission (
  role_name TEXT NOT NULL REFERENCES authorization.role(role_name),
  permission_id TEXT NOT NULL REFERENCES authorization.permission(permission_id),
  PRIMARY KEY (role_name, permission_id)
);

CREATE TABLE IF NOT EXISTS authorization.role_assignment (
  principal_id TEXT NOT NULL REFERENCES identity.principal(principal_id),
  role_name TEXT NOT NULL REFERENCES authorization.role(role_name),
  tenant_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (principal_id, role_name, tenant_id)
);

CREATE TABLE IF NOT EXISTS policy.policy (
  policy_id TEXT PRIMARY KEY,
  policy_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy.policy_version (
  policy_id TEXT NOT NULL REFERENCES policy.policy(policy_id),
  version TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'policy',
  content JSONB NOT NULL,
  lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (policy_id, version)
);

CREATE TABLE IF NOT EXISTS policy.policy_assignment (
  consumer_type TEXT NOT NULL,
  consumer_id TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_until TIMESTAMPTZ,
  PRIMARY KEY (consumer_type, consumer_id, policy_id, policy_version, assigned_at),
  FOREIGN KEY (policy_id, policy_version) REFERENCES policy.policy_version(policy_id, version)
);

CREATE TABLE IF NOT EXISTS authorization.decision (
  decision_id UUID PRIMARY KEY,
  request_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'DENY', 'APPROVAL_REQUIRED')),
  reason_code TEXT NOT NULL,
  actor_id TEXT,
  workload_id TEXT,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  policy_versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  trace_id TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS authorization.event (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  principal_id TEXT,
  workload_id TEXT,
  tenant_id TEXT NOT NULL,
  resource_ref TEXT,
  request_id TEXT,
  decision_id UUID REFERENCES authorization.decision(decision_id),
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION policy.prevent_policy_version_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'policy versions are immutable';
END;
$$;

DROP TRIGGER IF EXISTS policy_version_immutable ON policy.policy_version;
CREATE TRIGGER policy_version_immutable
BEFORE UPDATE OR DELETE ON policy.policy_version
FOR EACH ROW EXECUTE FUNCTION policy.prevent_policy_version_update();

INSERT INTO platform.schema_metadata (key, value)
VALUES ('migration_version', '002')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
