import type { RegistryStore } from "./store.js";
import type {
  AgentIdentity,
  AgentVersion,
  ArtifactIdentity,
  ArtifactVersion,
  LifecycleState,
} from "./types.js";

export interface SqlQueryResult<Row> {
  rows: Row[];
}

export type SqlExecutor = <Row = Record<string, unknown>>(
  text: string,
  values?: readonly unknown[],
) => Promise<SqlQueryResult<Row>>;

export class SqlRegistryStore implements RegistryStore {
  constructor(private readonly query: SqlExecutor) {}

  async createArtifact(identity: ArtifactIdentity): Promise<void> {
    await this.query(
      `INSERT INTO registry.artifact
       (artifact_type, artifact_id, name, description, owner_ref, tenant_id, business_unit, lifecycle_status, risk_classification, data_classification)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [identity.artifactType, identity.artifactId, identity.name, identity.description ?? null, identity.ownerRef, identity.tenantId, identity.businessUnit ?? null, identity.lifecycleStatus, identity.riskClassification ?? null, identity.dataClassification ?? null],
    );
  }

  async getArtifact(artifactType: ArtifactIdentity["artifactType"], artifactId: string): Promise<ArtifactIdentity | undefined> {
    const result = await this.query<ArtifactIdentity>(
      `SELECT artifact_type AS "artifactType", artifact_id AS "artifactId", name, description, owner_ref AS "ownerRef",
              tenant_id AS "tenantId", business_unit AS "businessUnit", lifecycle_status AS "lifecycleStatus",
              risk_classification AS "riskClassification", data_classification AS "dataClassification"
       FROM registry.artifact WHERE artifact_type = $1 AND artifact_id = $2`,
      [artifactType, artifactId],
    );
    return result.rows[0];
  }

  async createArtifactVersion(version: ArtifactVersion): Promise<void> {
    await this.query(
      `INSERT INTO registry.artifact_version
       (artifact_type, artifact_id, version, content, content_digest, lifecycle_status, created_by, created_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)`,
      [version.artifactType, version.artifactId, version.version, JSON.stringify(version.content), version.contentDigest, version.lifecycleStatus, version.createdBy, version.createdAt],
    );
  }

  async getArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string): Promise<ArtifactVersion | undefined> {
    const result = await this.query<ArtifactVersion & { content: string }>(
      `SELECT artifact_type AS "artifactType", artifact_id AS "artifactId", version, content,
              content_digest AS "contentDigest", lifecycle_status AS "lifecycleStatus",
              created_by AS "createdBy", created_at AS "createdAt"
       FROM registry.artifact_version WHERE artifact_type = $1 AND artifact_id = $2 AND version = $3`,
      [artifactType, artifactId, version],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return { ...row, content: typeof row.content === "string" ? JSON.parse(row.content) : row.content } as unknown as ArtifactVersion;
  }

  async listArtifactVersions(artifactType: ArtifactVersion["artifactType"], artifactId: string): Promise<readonly ArtifactVersion[]> {
    const result = await this.query<ArtifactVersion & { content: string }>(
      `SELECT artifact_type AS "artifactType", artifact_id AS "artifactId", version, content,
              content_digest AS "contentDigest", lifecycle_status AS "lifecycleStatus",
              created_by AS "createdBy", created_at AS "createdAt"
       FROM registry.artifact_version WHERE artifact_type = $1 AND artifact_id = $2 ORDER BY created_at DESC`,
      [artifactType, artifactId],
    );
    return result.rows.map((row) => ({ ...row, content: typeof row.content === "string" ? JSON.parse(row.content) : row.content })) as ArtifactVersion[];
  }

  async transitionArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string, lifecycleStatus: LifecycleState): Promise<void> {
    await this.query(
      `UPDATE registry.artifact_version SET lifecycle_status = $4 WHERE artifact_type = $1 AND artifact_id = $2 AND version = $3`,
      [artifactType, artifactId, version, lifecycleStatus],
    );
  }

  async createAgent(identity: AgentIdentity): Promise<void> {
    await this.query(
      `INSERT INTO registry.agent
       (agent_id, artifact_type, name, description, owner_ref, tenant_id, business_unit, lifecycle_status, risk_classification, data_classification)
       VALUES ($1,'agent',$2,$3,$4,$5,$6,$7,$8,$9)`,
      [identity.artifactId, identity.name, identity.description ?? null, identity.ownerRef, identity.tenantId, identity.businessUnit ?? null, identity.lifecycleStatus, identity.riskClassification, identity.dataClassification],
    );
  }

  async getAgent(agentId: string): Promise<AgentIdentity | undefined> {
    return this.getArtifact("agent", agentId) as Promise<AgentIdentity | undefined>;
  }

  async createAgentVersion(version: AgentVersion): Promise<void> {
    await this.query(
      `INSERT INTO registry.agent_version
       (agent_id, version, artifact_id_version, artifact_version, content, content_digest, lifecycle_status,
        capability_metadata, model_constraints, tool_references, knowledge_references, evaluation_status,
        deployment_status, access_requirements, declaration_schema_version, created_by, created_at)
       VALUES ($1,$2,$1,$2,$3::jsonb,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14,$15)`,
      [version.agentId, version.version, JSON.stringify(version.content), version.contentDigest, version.lifecycleStatus, JSON.stringify(version.capabilityMetadata), JSON.stringify(version.modelConstraints), JSON.stringify(version.toolReferences), JSON.stringify(version.knowledgeReferences), version.evaluationStatus ? JSON.stringify(version.evaluationStatus) : null, version.deploymentStatus ? JSON.stringify(version.deploymentStatus) : null, version.accessRequirements ? JSON.stringify(version.accessRequirements) : null, version.declarationSchemaVersion, version.createdBy, version.createdAt],
    );

    for (const policy of version.policyReferences) {
      await this.query(
        `INSERT INTO registry.agent_policy_reference
         (agent_id, agent_version, policy_id, policy_version, policy_type, relationship_context)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [version.agentId, version.version, policy.policyId, policy.policyVersion, policy.policyType, policy.relationshipContext],
      );
    }

    for (const dependency of version.dependencies) {
      await this.query(
        `INSERT INTO registry.declared_dependency
         (agent_id, agent_version, source_artifact_type, source_artifact_id, source_version,
          target_artifact_type, target_artifact_id, target_version, target_version_constraint,
          relationship_type, consumer_owner_ref, declaration_origin, source_repository_location)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [version.agentId, version.version, dependency.sourceArtifactType, dependency.sourceArtifactId, dependency.sourceVersion, dependency.targetArtifactType, dependency.targetArtifactId, dependency.targetVersion ?? null, dependency.targetVersionConstraint ?? null, dependency.relationshipType, dependency.consumerOwnerReference, dependency.declarationOrigin, dependency.sourceRepositoryLocation ?? null],
      );
    }
  }

  async getAgentVersion(agentId: string, version: string): Promise<AgentVersion | undefined> {
    const result = await this.query<AgentVersion & { content: string }>(
      `SELECT agent_id AS "agentId", version, artifact_version AS "artifactVersion", content,
              content_digest AS "contentDigest", lifecycle_status AS "lifecycleStatus",
              capability_metadata AS "capabilityMetadata", model_constraints AS "modelConstraints",
              tool_references AS "toolReferences", knowledge_references AS "knowledgeReferences",
              evaluation_status AS "evaluationStatus", deployment_status AS "deploymentStatus",
              access_requirements AS "accessRequirements", declaration_schema_version AS "declarationSchemaVersion",
              created_by AS "createdBy", created_at AS "createdAt"
       FROM registry.agent_version WHERE agent_id = $1 AND version = $2`,
      [agentId, version],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return { ...row, content: typeof row.content === "string" ? JSON.parse(row.content) : row.content } as unknown as AgentVersion;
  }

  async listAgentVersions(agentId: string): Promise<readonly AgentVersion[]> {
    const result = await this.query<AgentVersion & { content: string }>(
      `SELECT agent_id AS "agentId", version, artifact_version AS "artifactVersion", content,
              content_digest AS "contentDigest", lifecycle_status AS "lifecycleStatus",
              capability_metadata AS "capabilityMetadata", model_constraints AS "modelConstraints",
              tool_references AS "toolReferences", knowledge_references AS "knowledgeReferences",
              evaluation_status AS "evaluationStatus", deployment_status AS "deploymentStatus",
              access_requirements AS "accessRequirements", declaration_schema_version AS "declarationSchemaVersion",
              created_by AS "createdBy", created_at AS "createdAt"
       FROM registry.agent_version WHERE agent_id = $1 ORDER BY created_at DESC`,
      [agentId],
    );
    return result.rows.map((row) => ({ ...row, content: typeof row.content === "string" ? JSON.parse(row.content) : row.content })) as AgentVersion[];
  }

  async transitionAgentVersion(agentId: string, version: string, lifecycleStatus: LifecycleState): Promise<void> {
    await this.query(
      `UPDATE registry.agent_version SET lifecycle_status = $3 WHERE agent_id = $1 AND version = $2`,
      [agentId, version, lifecycleStatus],
    );
  }
}
