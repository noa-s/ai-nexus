import type { IdentityContext } from "../auth/types.js";

export const ARTIFACT_TYPES = ["agent", "prompt", "policy", "knowledge", "tool", "model-capability", "evaluation-suite", "platform-component"] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];
export const LIFECYCLE_STATES = ["DRAFT", "VALIDATING", "APPROVED", "PUBLISHED", "DEPRECATED", "ARCHIVED", "REVOKED"] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
export const DEPENDENCY_RELATIONSHIPS = ["runtime", "governance"] as const;
export type DependencyRelationship = (typeof DEPENDENCY_RELATIONSHIPS)[number];

export interface ArtifactIdentity { artifactType: ArtifactType; artifactId: string; name: string; description?: string; ownerId: string; tenantId: string; businessUnit?: string; lifecycleStatus: LifecycleState; createdAt: string; updatedAt: string; }
export interface PolicyVersionReference { policyId: string; policyVersion: string; policyType: string; relationship: string; context: string; }
export interface DependencyReference { sourceArtifactType: ArtifactType; sourceArtifactId: string; sourceVersion: string; targetArtifactType: ArtifactType; targetArtifactId: string; targetVersion?: string; targetVersionConstraint?: string; relationshipType: DependencyRelationship; consumerOwnerReference: string; declarationOrigin: string; sourceRepositoryLocation?: string; }
export interface ArtifactVersion { artifactType: ArtifactType; artifactId: string; version: string; content: Record<string, unknown>; contentDigest: string; lifecycleState: LifecycleState; createdAt: string; createdBy: string; }
export interface AgentIdentity extends ArtifactIdentity { artifactType: "agent"; riskClassification: string; dataClassification: string; }
export interface AgentVersion extends ArtifactVersion { artifactType: "agent"; agentId: string; declaredCapabilities: string[]; declaredTasks: string[]; modelCapabilityReferences: string[]; toolReferences: string[]; knowledgeConfigurationReferences: string[]; evaluationStatusReference?: string; deploymentStatus: string; accessRequirements: string[]; policyReferences: PolicyVersionReference[]; dependencies: DependencyReference[]; }
export interface ArtifactDeclaration { schemaVersion: "1"; artifactType: "agent"; artifactId: string; version: string; agentId: string; declaredCapabilities: string[]; declaredTasks: string[]; policyReferences: PolicyVersionReference[]; dependencies: DependencyReference[]; }
export interface RegistryActor extends IdentityContext { requestId?: string; traceId?: string; }
export interface RegistryAuditEvent { eventId: string; eventType: "REGISTRY_MUTATION" | "REGISTRY_REJECTED"; tenantId: string; actorId: string; action: string; target: string; resourceRef?: string; reasonCode: string; policyVersions: string[]; requestId?: string; decisionId?: string; traceId?: string; createdAt: string; }
