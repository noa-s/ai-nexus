import assert from "node:assert/strict";
import test from "node:test";
import { RegistryQueries } from "../src/registry/queries.js";
import { InMemoryRegistryStore } from "../src/registry/store.js";
import type { RegistryActor, RegistryAuditEvent, RegistryAuditSink, RegistryAuthorization } from "../src/registry/types.js";

class Audit implements RegistryAuditSink {
  events: RegistryAuditEvent[] = [];
  append(event: RegistryAuditEvent): void { this.events.push(event); }
}

const actor: RegistryActor = { subject: "user-1", principalType: "human", tenantId: "tenant-1", roles: ["registry-admin"] };
const authorization: RegistryAuthorization = { authorize: (current) => current.roles.includes("registry-admin") };

async function seeded() {
  const store = new InMemoryRegistryStore();
  const audit = new Audit();
  await store.createArtifact({ artifactType: "agent", artifactId: "agent-1", name: "Agent", ownerRef: "team", tenantId: "tenant-1", lifecycleStatus: "DRAFT" });
  await store.createArtifactVersion({ artifactType: "agent", artifactId: "agent-1", version: "1.0", content: { x: 1 }, contentDigest: "a".repeat(64), lifecycleStatus: "DRAFT", createdBy: "user-1", createdAt: new Date(0).toISOString() });
  await store.createArtifactVersion({ artifactType: "agent", artifactId: "agent-1", version: "2.0", content: { x: 2 }, contentDigest: "b".repeat(64), lifecycleStatus: "DRAFT", createdBy: "user-1", createdAt: new Date(0).toISOString() });
  return { queries: new RegistryQueries(store, authorization, audit), audit };
}

test("registry queries support exact lookup and version listing without latest indirection", async () => {
  const { queries } = await seeded();
  assert.equal((await queries.getArtifact(actor, "agent", "agent-1")).artifactId, "agent-1");
  assert.equal((await queries.getArtifactVersion(actor, "agent", "agent-1", "1.0")).version, "1.0");
  assert.deepEqual((await queries.listArtifactVersions(actor, "agent", "agent-1")).map((version) => version.version).sort(), ["1.0", "2.0"]);
});

test("artifact lifecycle transitions are explicit and preserve version content", async () => {
  const { queries } = await seeded();
  await queries.transitionArtifactVersion(actor, "agent", "agent-1", "1.0", "VALIDATING");
  const version = await queries.getArtifactVersion(actor, "agent", "agent-1", "1.0");
  assert.equal(version.lifecycleStatus, "VALIDATING");
  assert.deepEqual(version.content, { x: 1 });
  await assert.rejects(() => queries.transitionArtifactVersion(actor, "agent", "agent-1", "1.0", "DRAFT"), /invalid lifecycle transition/);
});

test("query authorization denial is audited", async () => {
  const { queries, audit } = await seeded();
  const deniedActor = { ...actor, roles: [] };
  await assert.rejects(() => queries.getArtifactVersion(deniedActor, "agent", "agent-1", "1.0"), /authorization denied/);
  assert.equal(audit.events[0]?.eventType, "REGISTRY_ACCESS_DENIED");
});
