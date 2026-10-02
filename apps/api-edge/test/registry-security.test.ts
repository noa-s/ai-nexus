import assert from "node:assert/strict";
import test from "node:test";
import { ArtifactAgentRegistry } from "../src/registry/registry.js";
import { InMemoryRegistryStore } from "../src/registry/store.js";
import type { RegistryAuditEvent, RegistryAuditSink, RegistryAuthorization } from "../src/registry/types.js";

const actor = { subject: "user-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["registry-admin"] };
const authorization: RegistryAuthorization = { authorize: () => true };
class Audit implements RegistryAuditSink { events: RegistryAuditEvent[] = []; append(event: RegistryAuditEvent): void { this.events.push(event); } }

function createRegistry() {
  const audit = new Audit();
  return { registry: new ArtifactAgentRegistry(new InMemoryRegistryStore(), authorization, audit, { exists: () => true, isAssignable: () => true }), audit };
}

test("rejects secret-like fields from ArtifactVersion and AgentVersion metadata", async () => {
  const { registry } = createRegistry();
  await registry.registerAgent({ actor, agentId: "a1", name: "Agent", ownerRef: "team", tenantId: "tenant-1", riskClassification: "low", dataClassification: "internal" });
  await assert.rejects(() => registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "a1", version: "1.0", content: { token: "secret-content" } }), /secret-like/);
  await registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "a1", version: "1.0", content: { safe: true } });
  await assert.rejects(() => registry.registerAgentVersion({ actor, agentId: "a1", version: "1.0", content: { safe: true }, declaration: { schemaVersion: "1", artifactType: "agent", artifactId: "a1", agentId: "a1", version: "1.0", dependencies: [], policyReferences: [], capabilityMetadata: {} }, capabilityMetadata: { apiKey: "secret-content" }, modelConstraints: {}, toolReferences: [], knowledgeReferences: [] }), /secret-like/);
});

test("records previous and resulting lifecycle state in registry audit events", async () => {
  const { registry, audit } = createRegistry();
  await registry.registerAgent({ actor, agentId: "a2", name: "Agent", ownerRef: "team", tenantId: "tenant-1", riskClassification: "low", dataClassification: "internal" });
  await registry.registerArtifactVersion({ actor, artifactType: "agent", artifactId: "a2", version: "1.0", content: { value: 1 } });
  await registry.registerAgentVersion({ actor, agentId: "a2", version: "1.0", content: { value: 1 }, declaration: { schemaVersion: "1", artifactType: "agent", artifactId: "a2", agentId: "a2", version: "1.0", dependencies: [], policyReferences: [], capabilityMetadata: {} }, capabilityMetadata: {}, modelConstraints: {}, toolReferences: [], knowledgeReferences: [], evaluationStatus: {}, accessRequirements: {} });
  await registry.transitionAgentVersion(actor, "a2", "1.0", "VALIDATING");
  const lifecycleEvent = audit.events.find((event) => event.action === "registry.agent-version.lifecycle");
  assert.equal(lifecycleEvent?.previousLifecycleStatus, "DRAFT");
  assert.equal(lifecycleEvent?.resultingLifecycleStatus, "VALIDATING");
});
