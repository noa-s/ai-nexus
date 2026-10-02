import { createHash, randomUUID } from "node:crypto";
import type { PolicyRegistry } from "../auth/policy-registry.js";
import {
  ARTIFACT_TYPES,
  DEPENDENCY_RELATIONSHIPS,
  LIFECYCLE_STATES,
  type AgentIdentity,
  type AgentVersion,
  type ArtifactDeclaration,
  type ArtifactIdentity,
  type ArtifactType,
  type ArtifactVersion,
  type DependencyReference,
  type LifecycleState,
  type PolicyVersionReference,
  type RegistryActor,
  type RegistryAuditEvent,
} from "./types.js";

export interface RegistryAuditSink {
  append(event: RegistryAuditEvent): void;
}

export class InMemoryRegistryAuditSink implements RegistryAuditSink {
  private readonly events: RegistryAuditEvent[] = [];

  append(event: RegistryAuditEvent): void {
    this.events.push(Object.freeze({ ...event }));
  }

  list(tenantId: string): readonly RegistryAuditEvent[] {
    return this.events.filter((event) => event.tenantId === tenantId);
  }
}

export interface RegistryOptions {
  policyRegistry: PolicyRegistry;
  auditSink?: RegistryAuditSink;
}

const immutableClone = <T>(value: T): T => structuredClone(value);

const digest = (content: Record<string, unknown>): string =>
  createHash("sha256").update(JSON.stringify(content, Object.keys(content).sort())).digest("hex");

const assertString = (value: string, field: string): void => {
  if (!value.trim()) throw new Error(`${field} is required`);
}

const assertArtifactType = (value: ArtifactType): void => {
  if (!ARTIFACT_TYPES.includes(value)) throw new Error(`unsupported artifact type: ${value}`);
};

const assertLifecycle = (value: LifecycleState): void => {
  if (!LIFECYCLE_STATES.includes(value)) throw new Error(`unsupported lifecycle state: ${value}`);
};

const transitionAllowed = (from: LifecycleState, to: LifecycleState): boolean => {
  if (from === to) return true;
  if (to === "REVOKED") return from !== "ARCHIVED";
  const transitions: Record<LifecycleState, readonly LifecycleState[]> = {
    DRAFT: ["VALIDATING"],
    VALIDATING: ["APPROVED", "DRAFT"],
    APPROVED: ["PUBLISHED", "DRAFT"],
    PUBLISHED: ["DEPRECATED", "REVOKED"],
    DEPRECATED: ["ARCHIVED", "REVOKED"],
    ARCHIVED: [],
    REVOKED: [],
  };
  return transitions[from].includes(to);
};

const canMutate = (actor: RegistryActor): boolean =>
  actor.roles.includes("service") || actor.roles.includes("registry-admin");

const canRead = (actor: RegistryActor, tenantId: string): boolean =>
  actor.tenantId === tenantId || actor.roles.includes("registry-admin");

export class ArtifactAgentRegistry {
  private readonly artifacts = new Map<string, ArtifactIdentity>();
  private readonly versions = new Map<string, ArtifactVersion>();
  private readonly agents = new Map<string, AgentIdentity>();
  private readonly agentVersions = new Map<string, AgentVersion>();

  readonly auditSink: RegistryAuditSink;

  constructor(private readonly options: RegistryOptions) {
    this.auditSink = options.auditSink ?? new InMemoryRegistryAuditSink();
  }

  createArtifact(actor: RegistryActor, input: Omit<ArtifactIdentity, "createdAt" | "updatedAt">): ArtifactIdentity {
    this.assertMutation(actor, input.tenantId, "artifact.create", input.artifactId);
    assertArtifactType(input.artifactType);
    assertString(input.artifactId, "artifactId");
    assertString(input.ownerId, "ownerId");
    const key = this.artifactKey(input.artifactType, input.artifactId);
    if (this.artifacts.has(key)) return this.reject("artifact.create", actor, input.artifactId, "ARTIFACT_EXISTS");

    const now = new Date().toISOString();
    const artifact = Object.freeze({ ...immutableClone(input), createdAt: now, updatedAt: now });
    this.artifacts.set(key, artifact);
    this.record("artifact.create", actor, input.artifactId, "REGISTRY_MUTATION");
    return artifact;
  }

  createVersion(
    actor: RegistryActor,
    input: Omit<ArtifactVersion, "contentDigest" | "createdAt">,
  ): ArtifactVersion {
    this.assertMutation(actor, this.artifactTenant(input.artifactType, input.artifactId), "artifact-version.create", input.artifactId);
    assertArtifactType(input.artifactType);
    assertString(input.version, "version");
    const artifact = this.artifacts.get(this.artifactKey(input.artifactType, input.artifactId));
    if (!artifact) return this.reject("artifact-version.create", actor, input.artifactId, "ARTIFACT_NOT_FOUND");
    const key = this.versionKey(input.artifactType, input.artifactId, input.version);
    if (this.versions.has(key)) return this.reject("artifact-version.create", actor, key, "VERSION_EXISTS");
    assertLifecycle(input.lifecycleState);

    const content = immutableClone(input.content);
    const version = Object.freeze({
      ...immutableClone(input),
      content,
      contentDigest: digest(content),
      createdAt: new Date().toISOString(),
    });
    this.versions.set(key, version);
    this.record("artifact-version.create", actor, key, "REGISTRY_MUTATION");
    return version;
  }

  registerAgent(
    actor: RegistryActor,
    input: Omit<AgentIdentity, "artifactType" | "createdAt" | "updatedAt">,
  ): AgentIdentity {
    const artifact = this.createArtifact(actor, {
      ...input,
      artifactType: "agent",
    });
    const agent = Object.freeze({ ...artifact, artifactType: "agent", riskClassification: input.riskClassification, dataClassification: input.dataClassification });
    this.agents.set(input.artifactId, agent);
    return agent;
  }

  createAgentVersion(actor: RegistryActor, declaration: ArtifactDeclaration, content: Record<string, unknown>): AgentVersion {
    const agent = this.agents.get(declaration.agentId);
    if (!agent) return this.reject("agent-version.create", actor, declaration.agentId, "AGENT_NOT_FOUND");
    if (declaration.schemaVersion !== "1") return this.reject("agent-version.create", actor, declaration.agentId, "DECLARATION_SCHEMA_UNSUPPORTED");
    if (declaration.artifactId !== declaration.agentId) return this.reject("agent-version.create", actor, declaration.agentId, "AGENT_ARTIFACT_MISMATCH");
    if (declaration.artifactType !== "agent") return this.reject("agent-version.create", actor, declaration.agentId, "ARTIFACT_TYPE_MISMATCH");

    const artifactVersion = this.createVersion(actor, {
      artifactType: "agent",
      artifactId: declaration.agentId,
      version: declaration.version,
      content,
      lifecycleState: "DRAFT",
      createdBy: actor.subject,
    });

    if (artifactVersion.version !== declaration.version) return this.reject("agent-version.create", actor, declaration.agentId, "DECLARATION_VERSION_MISMATCH");
    this.validatePolicyReferences(declaration.policyReferences, actor, agent.tenantId);
    this.validateDependencies(declaration.dependencies);

    const version: AgentVersion = Object.freeze({
      ...artifactVersion,
      agentId: declaration.agentId,
      declaredCapabilities: [...declaration.declaredCapabilities],
      declaredTasks: [...declaration.declaredTasks],
      modelCapabilityReferences: [],
      toolReferences: [],
      knowledgeConfigurationReferences: [],
      deploymentStatus: "UNDEPLOYED",
      accessRequirements: [],
      policyReferences: immutableClone(declaration.policyReferences),
      dependencies: immutableClone(declaration.dependencies),
    });
    this.agentVersions.set(this.versionKey("agent", declaration.agentId, declaration.version), version);
    this.record("agent-version.create", actor, `${declaration.agentId}@${declaration.version}`, "REGISTRY_MUTATION");
    return version;
  }

  transitionLifecycle(actor: RegistryActor, artifactType: ArtifactType, artifactId: string, version: string, next: LifecycleState): ArtifactVersion {
    const current = this.getVersion(actor, artifactType, artifactId, version);
    if (!transitionAllowed(current.lifecycleState, next)) {
      return this.reject("artifact-version.lifecycle", actor, this.versionKey(artifactType, artifactId, version), "INVALID_LIFECYCLE_TRANSITION");
    }
    const updated = Object.freeze({ ...current, lifecycleState: next });
    this.versions.set(this.versionKey(artifactType, artifactId, version), updated);
    const agentVersionKey = this.versionKey("agent", artifactId, version);
    const agentVersion = this.agentVersions.get(agentVersionKey);
    if (agentVersion) this.agentVersions.set(agentVersionKey, Object.freeze({ ...agentVersion, lifecycleState: next }));
    this.record("artifact-version.lifecycle", actor, this.versionKey(artifactType, artifactId, version), "REGISTRY_MUTATION");
    return updated;
  }

  getVersion(actor: RegistryActor, artifactType: ArtifactType, artifactId: string, version: string): ArtifactVersion {
    assertArtifactType(artifactType);
    if (!canRead(actor, this.artifactTenant(artifactType, artifactId))) return this.reject("artifact-version.read", actor, `${artifactId}@${version}`, "TENANT_ACCESS_DENIED");
    const value = this.versions.get(this.versionKey(artifactType, artifactId, version));
    if (!value) return this.reject("artifact-version.read", actor, `${artifactId}@${version}`, "VERSION_NOT_FOUND");
    return immutableClone(value);
  }

  getAgentVersion(actor: RegistryActor, agentId: string, version: string): AgentVersion {
    const agent = this.agents.get(agentId);
    if (!agent || !canRead(actor, agent.tenantId)) return this.reject("agent-version.read", actor, `${agentId}@${version}`, "VERSION_NOT_FOUND");
    const value = this.agentVersions.get(this.versionKey("agent", agentId, version));
    if (!value) return this.reject("agent-version.read", actor, `${agentId}@${version}`, "VERSION_NOT_FOUND");
    return immutableClone(value);
  }

  private validatePolicyReferences(references: readonly PolicyVersionReference[], actor: RegistryActor, tenantId: string): void {
    if (!canRead(actor, tenantId)) this.reject("agent-version.policy-reference", actor, "policy", "TENANT_ACCESS_DENIED");
    for (const reference of references) {
      if (!this.options.policyRegistry.getVersion(reference.policyId, reference.policyVersion)) {
        this.reject("agent-version.policy-reference", actor, `${reference.policyId}@${reference.policyVersion}`, "POLICY_VERSION_NOT_FOUND");
      }
    }
  }

  private validateDependencies(dependencies: readonly DependencyReference[]): void {
    for (const dependency of dependencies) {
      if (!DEPENDENCY_RELATIONSHIPS.includes(dependency.relationshipType)) throw new Error(`unsupported dependency relationship: ${dependency.relationshipType}`);
      if (!dependency.targetVersion && !dependency.targetVersionConstraint) throw new Error("dependency requires targetVersion or targetVersionConstraint");
      if (dependency.targetVersion && dependency.targetVersionConstraint) throw new Error("dependency cannot contain both targetVersion and targetVersionConstraint");
    }
  }

  private assertMutation(actor: RegistryActor, tenantId: string, action: string, target: string): void {
    if (!canMutate(actor)) this.reject(action, actor, target, "REGISTRY_MUTATION_DENIED");
    if (!canRead(actor, tenantId)) this.reject(action, actor, target, "TENANT_ACCESS_DENIED");
  }

  private artifactTenant(artifactType: ArtifactType, artifactId: string): string {
    if (artifactType === "agent") return this.agents.get(artifactId)?.tenantId ?? "";
    return this.artifacts.get(this.artifactKey(artifactType, artifactId))?.tenantId ?? "";
  }

  private artifactKey(artifactType: ArtifactType, artifactId: string): string {
    return `${artifactType}:${artifactId}`;
  }

  private versionKey(artifactType: ArtifactType, artifactId: string, version: string): string {
    return `${this.artifactKey(artifactType, artifactId)}@${version}`;
  }

  private record(action: string, actor: RegistryActor, target: string, eventType: RegistryAuditEvent["eventType"], reasonCode = "OK"): void {
    this.auditSink.append({ eventId: randomUUID(), eventType, tenantId: actor.tenantId, actorId: actor.subject, action, target, resourceRef: target, reasonCode, createdAt: new Date().toISOString() });
  }

  private reject<T>(action: string, actor: RegistryActor, target: string, reasonCode: string): T {
    this.record(action, actor, target, "REGISTRY_REJECTED", reasonCode);
    throw new Error(reasonCode);
  }
}
