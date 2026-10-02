import type { AuthorizationPolicySet, PolicyConstraint, RoleDefinition } from "./authorization.js";

export type PolicyLifecycleStatus = "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED" | "REVOKED";

export interface PolicyVersion {
  policyId: string;
  version: string;
  artifactType: "policy";
  content: readonly PolicyConstraint[];
  lifecycleStatus: PolicyLifecycleStatus;
  createdAt: string;
}

export interface PolicyAssignment {
  consumerType: string;
  consumerId: string;
  policyId: string;
  policyVersion: string;
  assignedAt: string;
  assignedUntil?: string;
}

export interface PolicyRegistry {
  createVersion(input: Omit<PolicyVersion, "artifactType" | "createdAt">): PolicyVersion;
  getVersion(policyId: string, version: string): PolicyVersion | null;
  transitionLifecycle(policyId: string, version: string, lifecycleStatus: PolicyLifecycleStatus): PolicyVersion;
  assign(assignment: Omit<PolicyAssignment, "assignedAt">): PolicyAssignment;
  getAssignmentHistory(consumerType: string, consumerId: string): readonly PolicyAssignment[];
  getAuthorizationPolicySet(consumerType: string, consumerId: string): AuthorizationPolicySet;
}

const cloneConstraints = (constraints: readonly PolicyConstraint[]): readonly PolicyConstraint[] =>
  constraints.map((constraint) => ({ ...constraint }));

export class InMemoryPolicyRegistry implements PolicyRegistry {
  private readonly versions = new Map<string, PolicyVersion>();
  private readonly assignments: PolicyAssignment[] = [];

  constructor(private readonly roles: readonly RoleDefinition[]) {}

  createVersion(input: Omit<PolicyVersion, "artifactType" | "createdAt">): PolicyVersion {
    const key = `${input.policyId}@${input.version}`;
    if (this.versions.has(key)) throw new Error(`policy version already exists: ${key}`);

    const version: PolicyVersion = Object.freeze({
      policyId: input.policyId,
      version: input.version,
      artifactType: "policy",
      content: Object.freeze(cloneConstraints(input.content)),
      lifecycleStatus: input.lifecycleStatus,
      createdAt: new Date().toISOString(),
    });
    this.versions.set(key, version);
    return version;
  }

  getVersion(policyId: string, version: string): PolicyVersion | null {
    return this.versions.get(`${policyId}@${version}`) ?? null;
  }

  transitionLifecycle(policyId: string, version: string, lifecycleStatus: PolicyLifecycleStatus): PolicyVersion {
    const current = this.getVersion(policyId, version);
    if (!current) throw new Error(`policy version not found: ${policyId}@${version}`);

    const next: PolicyVersion = Object.freeze({ ...current, lifecycleStatus });
    this.versions.set(`${policyId}@${version}`, next);
    return next;
  }

  assign(input: Omit<PolicyAssignment, "assignedAt">): PolicyAssignment {
    const version = this.getVersion(input.policyId, input.policyVersion);
    if (!version) throw new Error(`policy version not found: ${input.policyId}@${input.policyVersion}`);
    if (version.lifecycleStatus !== "ACTIVE") throw new Error(`only ACTIVE policies can be assigned: ${input.policyId}@${input.policyVersion}`);

    const assignment: PolicyAssignment = Object.freeze({
      ...input,
      assignedAt: new Date().toISOString(),
    });
    this.assignments.push(assignment);
    return assignment;
  }

  getAssignmentHistory(consumerType: string, consumerId: string): readonly PolicyAssignment[] {
    return this.assignments.filter(
      (assignment) => assignment.consumerType === consumerType && assignment.consumerId === consumerId,
    );
  }

  getAuthorizationPolicySet(consumerType: string, consumerId: string): AuthorizationPolicySet {
    const assignments = this.getAssignmentHistory(consumerType, consumerId);
    const policies = assignments
      .map((assignment) => this.getVersion(assignment.policyId, assignment.policyVersion))
      .filter((version): version is PolicyVersion => version !== null && version.lifecycleStatus === "ACTIVE")
      .flatMap((version) => version.content);

    return {
      roles: this.roles.map((role) => ({ ...role, permissions: role.permissions.map((permission) => ({ ...permission })) })),
      policies: policies.map((policy) => ({ ...policy })),
    };
  }
}

const demoRegistry = new InMemoryPolicyRegistry([
  { name: "user", permissions: [{ action: "resource.read", target: "protected-resource" }] },
  { name: "auditor", permissions: [{ action: "evidence.read", target: "authorization-events" }] },
  { name: "service", permissions: [{ action: "service.call", target: "service:policy-registry" }] },
]);

demoRegistry.createVersion({
  policyId: "policy.resource-read",
  version: "1",
  lifecycleStatus: "ACTIVE",
  content: [
    {
      id: "policy.resource-read",
      version: "1",
      effect: "ALLOW",
      action: "resource.read",
      target: "protected-resource",
      priority: 10,
    },
  ],
});
demoRegistry.assign({
  consumerType: "service",
  consumerId: "api-edge",
  policyId: "policy.resource-read",
  policyVersion: "1",
});

demoRegistry.createVersion({
  policyId: "policy.service-call",
  version: "1",
  lifecycleStatus: "ACTIVE",
  content: [
    {
      id: "policy.service-call",
      version: "1",
      effect: "ALLOW",
      action: "service.call",
      target: "service:policy-registry",
      priority: 10,
    },
  ],
});
demoRegistry.assign({
  consumerType: "service",
  consumerId: "api-edge",
  policyId: "policy.service-call",
  policyVersion: "1",
});

export const demoPolicyRegistry: PolicyRegistry = demoRegistry;
