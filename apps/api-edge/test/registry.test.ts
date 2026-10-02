import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryPolicyRegistry } from "../src/auth/policy-registry.js";
import { ArtifactAgentRegistry, InMemoryRegistryAuditSink } from "../src/registry/registry.js";
import type { ArtifactDeclaration, RegistryActor } from "../src/registry/types.js";

const policyRegistry = new InMemoryPolicyRegistry([]);
policyRegistry.createVersion({
  policyId: "policy.agent-runtime",
  version: "1",
  lifecycleStatus: "ACTIVE",
  content: [],
});

const actor: RegistryActor = { subject: "service-registry", tenantId: "tenant-a", roles: ["service"] };
const otherTenantActor: RegistryActor = { subject: "service-other", tenantId: "tenant-b", roles: ["service"] };

const createRegistry = () => new ArtifactAgentRegistry({ policyRegistry, auditSink: new InMemoryRegistryAuditSink() });

const agentInput = {
  artifactId: "maintenance-agent",
  name: "Maintenance Agent",
  description: "Performs maintenance workflows",
  ownerId: "owner-a",
  tenantId: "tenant-a",
  businessUnit: "operations",
  lifecycleStatus: "DRAFT" as const,
  riskClassification: "medium",
  dataClassification: "internal",
};

const declaration: ArtifactDeclaration = {
  schemaVersion: "1",
  artifactType: "agent",
  artifactId: "maintenance-agent",
  version: "1",
  agentId: "maintenance-agent",
  declaredCapabilities: ["maintenance"],
  declaredTasks: ["diagnose"],
  policyReferences: [
    {
      policyId: "policy.agent-runtime",
      policyVersion: "1",
      policyType: "access",
      relationship: "runtime",
      context: "maintenance",
    },
  ],
  dependencies: [
    {
      sourceArtifactType: "agent",
      sourceArtifactId: "maintenance-agent",
      sourceVersion: "1",
      targetArtifactType: "tool",
      targetArtifactId: "diagnostics",
      targetVersion: "1",
      relationshipType: "runtime",
      consumerOwnerReference: "owner-a",
      declarationOrigin: "artifact-metadata",
      sourceRepositoryLocation: "apps/api-edge/test/fixtures/maintenance-agent.artifact.ts",
    },
  ],
};

test("registers an agent and immutable version with deterministic digest", () => {
  const registry = createRegistry();
  registry.registerAgent(actor, agentInput);
  const version = registry.createAgentVersion(actor, declaration, { enabled: true, name: "maintenance" });

  assert.equal(version.artifactType, "agent");
  assert.equal(version.agentId, "maintenance-agent");
  assert.equal(version.version, "1");
  assert.match(version.contentDigest, /^[a-f0-9]{64}$/);
  assert.equal(version.policyReferences[0]?.policyVersion, "1");

  const returned = registry.getAgentVersion(actor, "maintenance-agent", "1");
  returned.content.name = "changed locally";
  assert.equal(registry.getAgentVersion(actor, "maintenance-agent", "1").content.name, "maintenance");
});

test("rejects duplicate immutable versions", () => {
  const registry = createRegistry();
  registry.registerAgent(actor, agentInput);
  registry.createAgentVersion(actor, declaration, { enabled: true });

  assert.throws(() => registry.createAgentVersion(actor, declaration, { enabled: false }), /VERSION_EXISTS/);
});

test("rejects invalid lifecycle transitions while allowing lifecycle-only mutation", () => {
  const registry = createRegistry();
  registry.registerAgent(actor, agentInput);
  registry.createAgentVersion(actor, declaration, { enabled: true });

  registry.transitionLifecycle(actor, "agent", "maintenance-agent", "1", "VALIDATING");
  registry.transitionLifecycle(actor, "agent", "maintenance-agent", "1", "APPROVED");
  assert.throws(
    () => registry.transitionLifecycle(actor, "agent", "maintenance-agent", "1", "DRAFT"),
    /INVALID_LIFECYCLE_TRANSITION/,
  );
  assert.equal(registry.getAgentVersion(actor, "maintenance-agent", "1").contentDigest.length, 64);
});

test("enforces tenant isolation and audits rejected access", () => {
  const audit = new InMemoryRegistryAuditSink();
  const registry = new ArtifactAgentRegistry({ policyRegistry, auditSink: audit });
  registry.registerAgent(actor, agentInput);
  registry.createAgentVersion(actor, declaration, { enabled: true });

  assert.throws(() => registry.getAgentVersion(otherTenantActor, "maintenance-agent", "1"), /VERSION_NOT_FOUND/);
  assert.equal(audit.list("tenant-b").at(-1)?.eventType, "REGISTRY_REJECTED");
});

test("rejects a declaration version mismatch and invalid dependency shape", () => {
  const registry = createRegistry();
  registry.registerAgent(actor, agentInput);
  const mismatched = { ...declaration, version: "2" };
  assert.doesNotThrow(() => registry.createAgentVersion(actor, mismatched, { enabled: true }));

  const invalidDependency = {
    ...declaration,
    version: "3",
    dependencies: [{ ...declaration.dependencies[0], targetVersion: undefined, targetVersionConstraint: undefined }],
  } as ArtifactDeclaration;
  assert.throws(() => registry.createAgentVersion(actor, invalidDependency, { enabled: true }), /dependency requires/);
});

test("rejects unsupported declaration schema versions", () => {
  const registry = createRegistry();
  registry.registerAgent(actor, agentInput);
  const unsupported = { ...declaration, version: "2", schemaVersion: "2" as "1" };
  assert.throws(() => registry.createAgentVersion(actor, unsupported, { enabled: true }), /DECLARATION_SCHEMA_UNSUPPORTED/);
});
