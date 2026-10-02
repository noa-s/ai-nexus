import assert from "node:assert/strict";
import test from "node:test";
import { ArtifactAgentRegistry } from "../src/registry/registry.js";
import { InMemoryRegistryStore } from "../src/registry/store.js";
import type { AgentArtifactDeclaration, RegistryAuditSink, RegistryAuthorization } from "../src/registry/types.js";

const actor = { subject: "user-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["registry-admin"] };
const authorization: RegistryAuthorization = { authorize: (current) => current.roles.includes("registry-admin") };
class Audit implements RegistryAuditSink { append(): void {} }

const content = { instructions: "example" };
const declaration: AgentArtifactDeclaration = {
  schemaVersion: "1",
  artifactType: "agent",
  artifactId: "policy-agent",
  agentId: "policy-agent",
  version: "1.0",
  dependencies: [],
  policyReferences: [{ policyId: "agent-policy", policyVersion: "1", policyType: "agent", relationshipContext: "execution" }],
  capabilityMetadata: {},
};

test("an already-registered AgentVersion remains referenceable when its policy becomes non-assignable", async () => {
  let assignable = true;
  const policies = { exists: () => true, isAssignable: () => assignable };
  const store = new InMemoryRegistryStore();
  const registry = new ArtifactAgentRegistry(store, authorization, new Audit(), policies);

  await registry.registerAgent({ actor, agentId: "policy-agent", name: "Policy Agent", ownerRef: "team", tenantId: "tenant-1", riskClassification: "low", dataClassification: "internal" });
  await registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "policy-agent", version: "1.0", content });
  await registry.registerAgentVersion({ actor, agentId: "policy-agent", version: "1.0", content, declaration, capabilityMetadata: {}, modelConstraints: {}, toolReferences: [], knowledgeReferences: [], evaluationStatus: { reference: "evaluation://1" }, accessRequirements: {} });

  assignable = false;
  assert.equal(await registry.isGovernedEligible(actor, "policy-agent", "1.0"), true);
});
