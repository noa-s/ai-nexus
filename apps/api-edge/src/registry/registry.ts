import { createHash, randomUUID } from "node:crypto";
import type { RegistryStore, PolicyReferenceResolver } from "./store.js";
import type {
  AgentArtifactDeclaration,
  AgentIdentity,
  AgentVersion,
  ArtifactIdentity,
  ArtifactType,
  ArtifactVersion,
  DependencyReference,
  LifecycleState,
  RegistryActor,
  RegistryAuditEvent,
  RegistryAuditSink,
  RegistryAuthorization,
} from "./types.js";

const transitions: Record<LifecycleState, readonly LifecycleState[]> = {
  DRAFT: ["VALIDATING", "REVOKED"],
  VALIDATING: ["APPROVED", "REVOKED"],
  APPROVED: ["PUBLISHED", "REVOKED"],
  PUBLISHED: ["DEPRECATED", "REVOKED"],
  DEPRECATED: ["ARCHIVED", "REVOKED"],
  ARCHIVED: [],
  REVOKED: [],
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function canonicalContent(value: Record<string, unknown>): string {
  return JSON.stringify(canonicalize(value));
}

export function contentDigest(value: Record<string, unknown>): string {
  return createHash("sha256").update(canonicalContent(value)).digest("hex");
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required`);
}

function assertVersion(version: string): void {
  assertNonEmpty(version, "version");
}

function assertLifecycleTransition(current: LifecycleState, next: LifecycleState): void {
  if (!transitions[current].includes(next)) {
    throw new Error(`invalid lifecycle transition: ${current} -> ${next}`);
  }
}

function assertDependency(reference: DependencyReference): void {
  assertNonEmpty(reference.sourceArtifactType, "sourceArtifactType");
  assertNonEmpty(reference.sourceArtifactId, "sourceArtifactId");
  assertNonEmpty(reference.sourceVersion, "sourceVersion");
  assertNonEmpty(reference.targetArtifactType, "targetArtifactType");
  assertNonEmpty(reference.targetArtifactId, "targetArtifactId");
  assertNonEmpty(reference.consumerOwnerReference, "consumerOwnerReference");
  assertNonEmpty(reference.declarationOrigin, "declarationOrigin");
  if ((reference.targetVersion === undefined) === (reference.targetVersionConstraint === undefined)) {
    throw new Error("dependency must specify exactly one of targetVersion or targetVersionConstraint");
  }
}

function assertAuthorization(
  actor: RegistryActor,
  authorization: RegistryAuthorization,
  action: string,
  target: string,
  audit: RegistryAuditSink,
  details: Pick<RegistryAuditEvent, "artifactType" | "artifactId" | "version"> = {},
): void {
  if (authorization.authorize(actor, action, target)) return;
  audit.append({
    eventId: randomUUID(),
    eventType: "REGISTRY_ACCESS_DENIED",
    actor: actor.subject,
    principalType: actor.principalType,
    tenantId: actor.tenantId,
    action,
    target,
    ...details,
    reasonCode: "REGISTRY_AUTHORIZATION_DENIED",
    createdAt: new Date().toISOString(),
  });
  throw new Error("registry authorization denied");
}

export interface RegisterArtifactInput extends Omit<ArtifactIdentity, "lifecycleStatus"> {
  lifecycleStatus?: LifecycleState;
}

export interface RegisterArtifactVersionInput {
  actor: RegistryActor;
  artifactType: ArtifactType;
  artifactId: string;
  version: string;
  content: Record<string, unknown>;
}

export interface RegisterAgentInput {
  actor: RegistryActor;
  name: string;
  description?: string;
  agentId: string;
  ownerRef: string;
  tenantId: string;
  businessUnit?: string;
  riskClassification: string;
  dataClassification: string;
}

export interface RegisterAgentVersionInput {
  actor: RegistryActor;
  agentId: string;
  version: string;
  content: Record<string, unknown>;
  declaration: AgentArtifactDeclaration;
  capabilityMetadata: Record<string, unknown>;
  modelConstraints: Record<string, unknown>;
  toolReferences: string[];
  knowledgeReferences: string[];
  evaluationStatus?: Record<string, unknown> | null;
  deploymentStatus?: Record<string, unknown> | null;
  accessRequirements?: Record<string, unknown> | null;
}

export class ArtifactAgentRegistry {
  constructor(
    private readonly store: RegistryStore,
    private readonly authorization: RegistryAuthorization,
    private readonly audit: RegistryAuditSink,
    private readonly policies: PolicyReferenceResolver,
  ) {}

  registerArtifact(input: RegisterArtifactInput): ArtifactIdentity {
    assertAuthorization(input.actor, this.authorization, "registry.artifact.create", `artifact:${input.artifactType}/${input.artifactId}`, this.audit, {
      artifactType: input.artifactType,
      artifactId: input.artifactId,
    });
    assertNonEmpty(input.artifactId, "artifactId");
    assertNonEmpty(input.name, "name");
    if (input.tenantId !== input.actor.tenantId) throw new Error("tenant mismatch");
    const identity: ArtifactIdentity = { ...input, lifecycleStatus: input.lifecycleStatus ?? "DRAFT" };
    this.store.createArtifact(identity);
    this.auditMutation(input.actor, "registry.artifact.create", identity.artifactType, identity.artifactId);
    return identity;
  }

  registerArtifactVersion(input: RegisterArtifactVersionInput): ArtifactVersion {
    assertAuthorization(input.actor, this.authorization, "registry.version.create", `artifact:${input.artifactType}/${input.artifactId}/${input.version}`, this.audit, input);
    assertVersion(input.version);
    const artifact = this.store.getArtifact(input.artifactType, input.artifactId);
    if (!artifact) throw new Error("artifact identity not found");
    if (artifact.tenantId !== input.actor.tenantId) throw new Error("tenant mismatch");
    const existing = this.store.getArtifactVersion(input.artifactType, input.artifactId, input.version);
    if (existing) {
      this.audit.append({
        eventId: randomUUID(),
        eventType: "REGISTRY_DUPLICATE_VERSION",
        actor: input.actor.subject,
        principalType: input.actor.principalType,
        tenantId: input.actor.tenantId,
        action: "registry.version.create",
        target: `artifact:${input.artifactType}/${input.artifactId}/${input.version}`,
        artifactType: input.artifactType,
        artifactId: input.artifactId,
        version: input.version,
        reasonCode: "DUPLICATE_VERSION",
        createdAt: new Date().toISOString(),
      });
      throw new Error("artifact version already exists");
    }
    const version: ArtifactVersion = {
      artifactType: input.artifactType,
      artifactId: input.artifactId,
      version: input.version,
      content: structuredClone(input.content),
      contentDigest: contentDigest(input.content),
      lifecycleStatus: "DRAFT",
      createdBy: input.actor.subject,
      createdAt: new Date().toISOString(),
    };
    this.store.createArtifactVersion(version);
    this.auditMutation(input.actor, "registry.version.create", input.artifactType, input.artifactId, input.version);
    return version;
  }

  registerAgent(input: RegisterAgentInput): AgentIdentity {
    assertAuthorization(input.actor, this.authorization, "registry.agent.create", `agent:${input.agentId}`, this.audit, {
      artifactType: "agent",
      artifactId: input.agentId,
    });
    if (input.tenantId !== input.actor.tenantId) throw new Error("tenant mismatch");
    const artifact: ArtifactIdentity = {
      artifactType: "agent",
      artifactId: input.agentId,
      name: input.name,
      description: input.description,
      ownerRef: input.ownerRef,
      tenantId: input.tenantId,
      businessUnit: input.businessUnit,
      riskClassification: input.riskClassification,
      dataClassification: input.dataClassification,
      lifecycleStatus: "DRAFT",
    };
    this.store.createArtifact(artifact);
    const agent: AgentIdentity = { ...artifact, artifactType: "agent", riskClassification: input.riskClassification, dataClassification: input.dataClassification };
    this.store.createAgent(agent);
    this.auditMutation(input.actor, "registry.agent.create", "agent", input.agentId);
    return agent;
  }

  registerAgentVersion(input: RegisterAgentVersionInput): AgentVersion {
    assertAuthorization(input.actor, this.authorization, "registry.agent-version.create", `agent:${input.agentId}/${input.version}`, this.audit, {
      artifactType: "agent",
      artifactId: input.agentId,
      version: input.version,
    });
    assertVersion(input.version);
    const agent = this.store.getAgent(input.agentId);
    if (!agent) throw new Error("agent identity not found");
    if (agent.tenantId !== input.actor.tenantId) throw new Error("tenant mismatch");
    if (input.declaration.schemaVersion !== "1") throw new Error("unsupported declaration schema version");
    if (input.declaration.artifactType !== "agent" || input.declaration.artifactId !== input.agentId || input.declaration.agentId !== input.agentId) {
      throw new Error("agent declaration identity mismatch");
    }
    if (input.declaration.version !== input.version) throw new Error("agent declaration version mismatch");
    for (const dependency of input.declaration.dependencies) assertDependency(dependency);
    for (const policy of input.declaration.policyReferences) {
      if (!this.policies.exists(policy)) throw new Error(`policy reference not found: ${policy.policyId}/${policy.policyVersion}`);
      if (!this.policies.isAssignable(policy, input.actor.tenantId)) throw new Error(`policy reference is not assignable: ${policy.policyId}/${policy.policyVersion}`);
    }
    const artifactVersion = this.store.getArtifactVersion("agent", input.agentId, input.version);
    if (!artifactVersion) throw new Error("corresponding artifact version not found");
    if (artifactVersion.contentDigest !== contentDigest(input.content)) throw new Error("artifact and agent version content digest mismatch");
    if (this.store.getAgentVersion(input.agentId, input.version)) throw new Error("agent version already exists");
    const version: AgentVersion = {
      agentId: input.agentId,
      version: input.version,
      artifactVersion: input.version,
      content: structuredClone(input.content),
      contentDigest: artifactVersion.contentDigest,
      lifecycleStatus: "DRAFT",
      capabilityMetadata: structuredClone(input.capabilityMetadata),
      modelConstraints: structuredClone(input.modelConstraints),
      toolReferences: [...input.toolReferences],
      knowledgeReferences: [...input.knowledgeReferences],
      evaluationStatus: input.evaluationStatus ? structuredClone(input.evaluationStatus) : null,
      deploymentStatus: input.deploymentStatus ? structuredClone(input.deploymentStatus) : null,
      accessRequirements: input.accessRequirements ? structuredClone(input.accessRequirements) : null,
      declarationSchemaVersion: "1",
      policyReferences: structuredClone(input.declaration.policyReferences),
      dependencies: structuredClone(input.declaration.dependencies),
      createdBy: input.actor.subject,
      createdAt: new Date().toISOString(),
    };
    this.store.createAgentVersion(version);
    this.auditMutation(input.actor, "registry.agent-version.create", "agent", input.agentId, input.version);
    return version;
  }

  transitionAgentVersion(actor: RegistryActor, agentId: string, version: string, next: LifecycleState): void {
    assertAuthorization(actor, this.authorization, "registry.agent-version.lifecycle", `agent:${agentId}/${version}`, this.audit, {
      artifactType: "agent",
      artifactId: agentId,
      version,
    });
    const current = this.store.getAgentVersion(agentId, version);
    if (!current) throw new Error("agent version not found");
    const agent = this.store.getAgent(agentId);
    if (!agent || agent.tenantId !== actor.tenantId) throw new Error("tenant mismatch");
    assertLifecycleTransition(current.lifecycleStatus, next);
    this.store.transitionAgentVersion(agentId, version, next);
    this.auditMutation(actor, "registry.agent-version.lifecycle", "agent", agentId, version);
  }

  getAgentVersion(actor: RegistryActor, agentId: string, version: string): AgentVersion {
    assertAuthorization(actor, this.authorization, "registry.agent-version.read", `agent:${agentId}/${version}`, this.audit, {
      artifactType: "agent",
      artifactId: agentId,
      version,
    });
    const agent = this.store.getAgent(agentId);
    if (!agent || agent.tenantId !== actor.tenantId) throw new Error("registry resource not found");
    const result = this.store.getAgentVersion(agentId, version);
    if (!result) throw new Error("agent version not found");
    return result;
  }

  isGovernedEligible(actor: RegistryActor, agentId: string, version: string): boolean {
    const value = this.getAgentVersion(actor, agentId, version);
    const agent = this.store.getAgent(agentId);
    if (!agent || !agent.ownerRef || !agent.riskClassification || !agent.dataClassification) return false;
    if (!["APPROVED", "PUBLISHED"].includes(value.lifecycleStatus)) return false;
    if (value.policyReferences.some((policy) => !this.policies.exists(policy))) return false;
    return value.evaluationStatus !== undefined && value.accessRequirements !== undefined;
  }

  private auditMutation(actor: RegistryActor, action: string, artifactType: ArtifactType, artifactId: string, version?: string): void {
    this.audit.append({
      eventId: randomUUID(),
      eventType: "REGISTRY_MUTATION",
      actor: actor.subject,
      principalType: actor.principalType,
      tenantId: actor.tenantId,
      action,
      target: `${artifactType}:${artifactId}${version ? `:${version}` : ""}`,
      artifactType,
      artifactId,
      version,
      reasonCode: "REGISTRY_MUTATION_ALLOWED",
      createdAt: new Date().toISOString(),
    });
  }
}
