import assert from "node:assert/strict";
import test from "node:test";
import { ArtifactAgentRegistry, contentDigest } from "../src/registry/registry.js";
import { InMemoryRegistryStore } from "../src/registry/store.js";
import type { AgentArtifactDeclaration, RegistryActor, RegistryAuditEvent, RegistryAuditSink, RegistryAuthorization } from "../src/registry/types.js";
import { exampleAgentArtifact } from "./fixtures/example-agent.artifact.js";

class TestAuditSink implements RegistryAuditSink {
  readonly events: RegistryAuditEvent[] = [];
  append(event: RegistryAuditEvent): void {
    this.events.push(event);
  }
}

const actor: RegistryActor = {
  subject: "principal-1",
  principalType: "human",
  tenantId: "tenant-1",
  roles: ["registry-admin"],
};

const otherTenantActor: RegistryActor = {
  ...actor,
  subject: "principal-2",
  tenantId: "tenant-2",
};

const authorization: RegistryAuthorization = {
  authorize: (current, action) => current.roles.includes("registry-admin") && action.startsWith("registry."),
};

function createRegistry() {
  const store = new InMemoryRegistryStore();
  const audit = new TestAuditSink();
  const policies = {
    exists: () => true,
    isAssignable: (_policy: unknown, tenantId: string) => tenantId === "tenant-1",
  };
  return { registry: new ArtifactAgentRegistry(store, authorization, audit, policies), store, audit };
}

async function registerExample(registry: ArtifactAgentRegistry, version = "1.0") {
  const declaration: AgentArtifactDeclaration = { ...exampleAgentArtifact, version };
  const content = { instructions: "example", version };
  await registry.registerAgent({
    actor,
    agentId: "example-agent",
    name: "Example Agent",
    description: "test agent",
    ownerRef: "team-example",
    tenantId: "tenant-1",
    riskClassification: "low",
    dataClassification: "internal",
  });
  await registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "example-agent", version, content });
  await registry.registerAgentVersion({
    actor,
    agentId: "example-agent",
    version,
    content,
    declaration,
    capabilityMetadata: { tasks: ["example"] },
    modelConstraints: { allowed: ["example-model"] },
    toolReferences: ["example-tool@2.0"],
    knowledgeReferences: [],
    evaluationStatus: { status: "not-run", reference: "evaluation://pending" },
    deploymentStatus: { status: "not-deployed" },
    accessRequirements: { roles: ["user"] },
  });
}

test("content digest is canonical across object key order", () => {
  assert.equal(contentDigest({ a: 1, nested: { z: 2, a: 3 } }), contentDigest({ nested: { a: 3, z: 2 }, a: 1 }));
});

test("registers an Agent as an Artifact specialization and preserves one version identity", async () => {
  const { registry, store, audit } = createRegistry();
  await registerExample(registry);

  const agentVersion = await registry.getAgentVersion(actor, "example-agent", "1.0");
  const artifactVersion = await store.getArtifactVersion("agent", "example-agent", "1.0");

  assert.equal(agentVersion?.artifactVersion, "1.0");
  assert.equal(agentVersion?.contentDigest, artifactVersion?.contentDigest);
  assert.equal(agentVersion?.declarationSchemaVersion, "1");
  assert.equal(audit.events.filter((event) => event.eventType === "REGISTRY_MUTATION").length, 3);
});

test("rejects duplicate artifact versions and audits the rejected attempt", async () => {
  const { registry, audit } = createRegistry();
  await registerExample(registry);
  await assert.rejects(() => registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "example-agent", version: "1.0", content: { instructions: "changed" } }), /already exists/);
  assert.equal(audit.events.some((event) => event.eventType === "REGISTRY_DUPLICATE_VERSION"), true);
});

test("rejects declaration version mismatch and digest mismatch", async () => {
  const { registry } = createRegistry();
  await registry.registerAgent({ actor, agentId: "example-agent", name: "Example", ownerRef: "team", tenantId: "tenant-1", riskClassification: "low", dataClassification: "internal" });
  await registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "example-agent", version: "1.0", content: { value: 1 } });

  await assert.rejects(() => registry.registerAgentVersion({
    actor,
    agentId: "example-agent",
    version: "1.0",
    content: { value: 2 },
    declaration: { ...exampleAgentArtifact, version: "1.0", artifactId: "example-agent", agentId: "example-agent" },
    capabilityMetadata: {},
    modelConstraints: {},
    toolReferences: [],
    knowledgeReferences: [],
  }), /digest mismatch/);

  await assert.rejects(() => registry.registerAgentVersion({
    actor,
    agentId: "example-agent",
    version: "1.0",
    content: { value: 1 },
    declaration: { ...exampleAgentArtifact, version: "2.0", artifactId: "example-agent", agentId: "example-agent" },
    capabilityMetadata: {},
    modelConstraints: {},
    toolReferences: [],
    knowledgeReferences: [],
  }), /version mismatch/);
});

test("rejects invalid lifecycle transitions and preserves immutable content", async () => {
  const { registry } = createRegistry();
  await registerExample(registry);
  const before = await registry.getAgentVersion(actor, "example-agent", "1.0");
  await registry.transitionAgentVersion(actor, "example-agent", "1.0", "VALIDATING");
  await registry.transitionAgentVersion(actor, "example-agent", "1.0", "APPROVED");
  await registry.transitionAgentVersion(actor, "example-agent", "1.0", "PUBLISHED");
  const after = await registry.getAgentVersion(actor, "example-agent", "1.0");
  assert.equal(after?.lifecycleStatus, "PUBLISHED");
  assert.deepEqual(after?.content, before?.content);
  await assert.rejects(() => registry.transitionAgentVersion(actor, "example-agent", "1.0", "DRAFT"), /invalid lifecycle transition/);
});

test("enforces tenant isolation for reads and registration", async () => {
  const { registry, audit } = createRegistry();
  await registerExample(registry);
  await assert.rejects(() => registry.getAgentVersion(otherTenantActor, "example-agent", "1.0"), /authorization denied|resource not found|tenant mismatch/);
  await assert.rejects(() => registry.registerArtifact({ actor: otherTenantActor, artifactType: "prompt", artifactId: "prompt-2", name: "Prompt", ownerRef: "team", tenantId: "tenant-1" }), /tenant mismatch/);
  assert.equal(audit.events.some((event) => event.eventType === "REGISTRY_ACCESS_DENIED"), false);
});

test("audits authorization denial without exposing artifact content", async () => {
  const audit = new TestAuditSink();
  const deny: RegistryAuthorization = { authorize: () => false };
  const registry = new ArtifactAgentRegistry(new InMemoryRegistryStore(), deny, audit, { exists: () => true, isAssignable: () => true });
  await assert.rejects(() => registry.registerArtifact({ actor, artifactType: "prompt", artifactId: "secret-prompt", name: "Prompt", ownerRef: "team", tenantId: "tenant-1" }), /authorization denied/);
  assert.equal(audit.events[0]?.reasonCode, "REGISTRY_AUTHORIZATION_DENIED");
  assert.equal(JSON.stringify(audit.events[0]).includes("secret-content"), false);
});

test("governed eligibility is explicit and does not depend on PUBLISHED alone", async () => {
  const { registry } = createRegistry();
  await registerExample(registry);
  assert.equal(await registry.isGovernedEligible(actor, "example-agent", "1.0"), false);
  await registry.transitionAgentVersion(actor, "example-agent", "1.0", "VALIDATING");
  await registry.transitionAgentVersion(actor, "example-agent", "1.0", "APPROVED");
  assert.equal(await registry.isGovernedEligible(actor, "example-agent", "1.0"), true);
});

test("static artifact declaration is schema-versioned and contains the Step 04 dependency input", () => {
  assert.equal(exampleAgentArtifact.schemaVersion, "1");
  assert.equal(exampleAgentArtifact.artifactType, "agent");
  assert.equal(exampleAgentArtifact.agentId, exampleAgentArtifact.artifactId);
  assert.equal(exampleAgentArtifact.dependencies[0]?.relationshipType, "runtime");
});
