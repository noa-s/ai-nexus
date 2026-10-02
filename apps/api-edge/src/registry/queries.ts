import { randomUUID } from "node:crypto";
import type { RegistryStore } from "./store.js";
import type { AgentVersion, ArtifactIdentity, ArtifactType, ArtifactVersion, LifecycleState, RegistryActor, RegistryAuditSink, RegistryAuthorization } from "./types.js";

const transitions: Record<LifecycleState, readonly LifecycleState[]> = { DRAFT: ["VALIDATING", "REVOKED"], VALIDATING: ["APPROVED", "REVOKED"], APPROVED: ["PUBLISHED", "REVOKED"], PUBLISHED: ["DEPRECATED", "REVOKED"], DEPRECATED: ["ARCHIVED", "REVOKED"], ARCHIVED: [], REVOKED: [] };

export class RegistryQueries {
  constructor(private readonly store: RegistryStore, private readonly authorization: RegistryAuthorization, private readonly audit: RegistryAuditSink) {}

  async getArtifact(actor: RegistryActor, artifactType: ArtifactType, artifactId: string): Promise<ArtifactIdentity> {
    const target = `artifact:${artifactType}/${artifactId}`;
    await this.authorize(actor, "registry.artifact.read", target, artifactType, artifactId);
    const artifact = await this.store.getArtifact(artifactType, artifactId);
    await this.assertTenant(actor, artifact?.tenantId, "registry.artifact.read", target, artifactType, artifactId);
    if (!artifact) throw new Error("registry resource not found");
    return artifact;
  }

  async getArtifactVersion(actor: RegistryActor, artifactType: ArtifactType, artifactId: string, version: string): Promise<ArtifactVersion> {
    const target = `artifact:${artifactType}/${artifactId}/${version}`;
    await this.authorize(actor, "registry.version.read", target, artifactType, artifactId, version);
    const artifact = await this.store.getArtifact(artifactType, artifactId);
    await this.assertTenant(actor, artifact?.tenantId, "registry.version.read", target, artifactType, artifactId, version);
    if (!artifact) throw new Error("registry resource not found");
    const result = await this.store.getArtifactVersion(artifactType, artifactId, version);
    if (!result) throw new Error("artifact version not found");
    return result;
  }

  async listArtifactVersions(actor: RegistryActor, artifactType: ArtifactType, artifactId: string): Promise<readonly ArtifactVersion[]> {
    const target = `artifact:${artifactType}/${artifactId}`;
    await this.authorize(actor, "registry.version.list", target, artifactType, artifactId);
    const artifact = await this.store.getArtifact(artifactType, artifactId);
    await this.assertTenant(actor, artifact?.tenantId, "registry.version.list", target, artifactType, artifactId);
    if (!artifact) throw new Error("registry resource not found");
    return this.store.listArtifactVersions(artifactType, artifactId);
  }

  async transitionArtifactVersion(actor: RegistryActor, artifactType: ArtifactType, artifactId: string, version: string, next: LifecycleState): Promise<void> {
    const target = `artifact:${artifactType}/${artifactId}/${version}`;
    await this.authorize(actor, "registry.version.lifecycle", target, artifactType, artifactId, version);
    const artifact = await this.store.getArtifact(artifactType, artifactId);
    await this.assertTenant(actor, artifact?.tenantId, "registry.version.lifecycle", target, artifactType, artifactId, version);
    if (!artifact) throw new Error("registry resource not found");
    const current = await this.store.getArtifactVersion(artifactType, artifactId, version);
    if (!current) throw new Error("artifact version not found");
    if (!transitions[current.lifecycleStatus].includes(next)) throw new Error(`invalid lifecycle transition: ${current.lifecycleStatus} -> ${next}`);
    await this.store.transitionArtifactVersion(artifactType, artifactId, version, next);
    await this.audit.append({ eventId: randomUUID(), eventType: "REGISTRY_MUTATION", actor: actor.subject, principalType: actor.principalType, tenantId: actor.tenantId, action: "registry.version.lifecycle", target, artifactType, artifactId, version, previousLifecycleStatus: current.lifecycleStatus, resultingLifecycleStatus: next, reasonCode: "REGISTRY_MUTATION_ALLOWED", createdAt: new Date().toISOString() });
  }

  async listAgentVersions(actor: RegistryActor, agentId: string): Promise<readonly AgentVersion[]> {
    const target = `agent:${agentId}`;
    await this.authorize(actor, "registry.agent-version.list", target, "agent", agentId);
    const agent = await this.store.getAgent(agentId);
    await this.assertTenant(actor, agent?.tenantId, "registry.agent-version.list", target, "agent", agentId);
    if (!agent) throw new Error("registry resource not found");
    return this.store.listAgentVersions(agentId);
  }

  private async authorize(actor: RegistryActor, action: string, target: string, artifactType?: ArtifactType, artifactId?: string, version?: string): Promise<void> {
    if (this.authorization.authorize(actor, action, target)) return;
    await this.audit.append({ eventId: randomUUID(), eventType: "REGISTRY_ACCESS_DENIED", actor: actor.subject, principalType: actor.principalType, tenantId: actor.tenantId, action, target, artifactType, artifactId, version, reasonCode: "REGISTRY_AUTHORIZATION_DENIED", createdAt: new Date().toISOString() });
    throw new Error("registry authorization denied");
  }

  private async assertTenant(actor: RegistryActor, resourceTenantId: string | undefined, action: string, target: string, artifactType: ArtifactType, artifactId: string, version?: string): Promise<void> {
    if (resourceTenantId === undefined || resourceTenantId === actor.tenantId) return;
    await this.audit.append({ eventId: randomUUID(), eventType: "REGISTRY_ACCESS_DENIED", actor: actor.subject, principalType: actor.principalType, tenantId: actor.tenantId, action, target, artifactType, artifactId, version, reasonCode: "REGISTRY_TENANT_SCOPE_DENIED", createdAt: new Date().toISOString() });
    throw new Error("tenant mismatch");
  }
}
