import type { IdentityContext } from "../auth/types.js";

export const ARTIFACT_TYPES = ["agent", "prompt", "policy", "knowledge", "tool", "model-capability", "evaluation-suite", "platform-component"] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];
export const LIFECYCLE_STATES = ["DRAFT", "VALIDATING", "APPROVED", "PUBLISHED", "DEPRECATED", "ARCHIVED", "REVOKED"] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
export type DependencyRelationship = "runtime" | "governance";
export type RegistryActor = IdentityContext;

export interface ArtifactIdentity { artifactType: ArtifactType; artifactId: string; name: string; description?: string; ownerRef: string; tenantId: string; businessUnit?: string; riskClassification?: string; dataClassification?: string; lifecycleStatus: LifecycleState; }
export interface ArtifactVersion { artifactType: ArtifactType; artifactId: string; version: string; content: Record<string, unknown>; contentDigest: string; lifecycleStatus: LifecycleState; createdBy: string; createdAt: string; }
export interface PolicyReference { policyId: string; policyVersion: string; policyType: string; relationshipContext: string; }
export interface DependencyReference { sourceArtifactType: string; sourceArtifactId: string; sourceVersion: string; targetArtifactType: string; targetArtifactId: string; targetVersion?: string; targetVersionConstraint?: string; relationshipType: DependencyRelationship; consumerOwnerReference: string; declarationOrigin: string; sourceRepositoryLocation?: string; }
export interface AgentIdentity extends ArtifactIdentity { artifactType: "agent"; riskClassification: string; dataClassification: string; }
export interface AgentVersion { agentId: string; version: string; artifactVersion: string; content: Record<string, unknown>; contentDigest: string; lifecycleStatus: LifecycleState; capabilityMetadata: Record<string, unknown>; modelConstraints: Record<string, unknown>; toolReferences: string[]; knowledgeReferences: string[]; evaluationStatus?: Record<string, unknown> | null; deploymentStatus?: Record<string, unknown> | null; accessRequirements?: Record<string, unknown> | null; declarationSchemaVersion: "1"; policyReferences: PolicyReference[]; dependencies: DependencyReference[]; createdBy: string; createdAt: string; }
export interface AgentArtifactDeclaration { schemaVersion: "1"; artifactType: "agent"; artifactId: string; version: string; agentId: string; dependencies: DependencyReference[]; policyReferences: PolicyReference[]; capabilityMetadata: Record<string, unknown>; }
export interface RegistryAuthorization { authorize(actor: RegistryActor, action: string, target: string): boolean; }
export interface RegistryAuditEvent {
  eventId: string;
  eventType: "REGISTRY_MUTATION" | "REGISTRY_ACCESS_DENIED" | "REGISTRY_DUPLICATE_VERSION" | "REGISTRY_INVALID_OPERATION";
  actor: string;
  principalType: RegistryActor["principalType"];
  tenantId: string;
  action: string;
  target: string;
  artifactType?: ArtifactType;
  artifactId?: string;
  version?: string;
  previousLifecycleStatus?: LifecycleState;
  resultingLifecycleStatus?: LifecycleState;
  reasonCode: string;
  createdAt: string;
}
export interface RegistryAuditSink { append(event: RegistryAuditEvent): void | Promise<void>; }
