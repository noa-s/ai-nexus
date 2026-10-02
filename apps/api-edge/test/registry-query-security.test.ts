import assert from "node:assert/strict";
import test from "node:test";
import { RegistryQueries } from "../src/registry/queries.js";
import { InMemoryRegistryStore } from "../src/registry/store.js";
import type { RegistryAuditEvent, RegistryAuditSink, RegistryAuthorization } from "../src/registry/types.js";

class Audit implements RegistryAuditSink { events: RegistryAuditEvent[] = []; append(event: RegistryAuditEvent): void { this.events.push(event); } }
const authorization: RegistryAuthorization = { authorize: () => true };
const owner = { subject: "owner", principalType: "human" as const, tenantId: "tenant-1", roles: ["registry-admin"] };
const foreign = { ...owner, subject: "foreign", tenantId: "tenant-2" };

test("cross-tenant registry query is denied and audited", async () => {
  const store = new InMemoryRegistryStore();
  const audit = new Audit();
  await store.createArtifact({ artifactType: "agent", artifactId: "a1", name: "Agent", ownerRef: "team", tenantId: "tenant-1", lifecycleStatus: "DRAFT" });
  const queries = new RegistryQueries(store, authorization, audit);

  await assert.rejects(() => queries.getArtifact(foreign, "agent", "a1"), /tenant mismatch/);
  assert.equal(audit.events.at(-1)?.reasonCode, "REGISTRY_TENANT_SCOPE_DENIED");
});
