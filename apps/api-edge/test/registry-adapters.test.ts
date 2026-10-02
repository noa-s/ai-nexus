import assert from "node:assert/strict";
import test from "node:test";
import { createRegistryAuthorization } from "../src/registry/authorization-adapter.js";
import { SqlRegistryAuditSink } from "../src/registry/sql-audit.js";
import { SqlRegistryStore, type SqlQueryResult } from "../src/registry/sql-store.js";
import type { RegistryAuditEvent } from "../src/registry/types.js";

const actor = {
  subject: "user-1",
  principalType: "human" as const,
  tenantId: "tenant-1",
  roles: ["registry-admin"],
};

const policySet = {
  roles: [{ name: "registry-admin", permissions: [{ action: "registry.read", target: "agent" }] }],
  policies: [],
};

test("registry authorization adapter delegates to the Step 02 authorization engine", () => {
  const adapter = createRegistryAuthorization(() => policySet);
  assert.equal(adapter.authorize(actor, "registry.read", "agent"), true);
  assert.equal(adapter.authorize(actor, "registry.write", "agent"), false);
});

test("SQL registry store emits parameterized persistence operations", async () => {
  const calls: Array<{ text: string; values: readonly unknown[] }> = [];
  const query = async <Row = Record<string, unknown>>(text: string, values: readonly unknown[] = []): Promise<SqlQueryResult<Row>> => {
    calls.push({ text, values });
    return { rows: [] };
  };
  const store = new SqlRegistryStore(query);

  await store.createArtifact({ artifactType: "agent", artifactId: "a1", name: "Agent", ownerRef: "team", tenantId: "tenant-1", lifecycleStatus: "DRAFT" });
  await store.createArtifactVersion({ artifactType: "agent", artifactId: "a1", version: "1.0", content: { x: 1 }, contentDigest: "a".repeat(64), lifecycleStatus: "DRAFT", createdBy: "user-1", createdAt: new Date(0).toISOString() });
  await store.transitionArtifactVersion("agent", "a1", "1.0", "VALIDATING");

  assert.equal(calls.length, 3);
  assert.match(calls[0]!.text, /INSERT INTO registry\.artifact/);
  assert.deepEqual(calls[0]!.values.slice(0, 2), ["agent", "a1"]);
  assert.match(calls[2]!.text, /UPDATE registry\.artifact_version SET lifecycle_status/);
});

test("SQL registry audit sink writes registry events into the existing immutable audit boundary", async () => {
  const calls: Array<{ text: string; values: readonly unknown[] }> = [];
  const query = async <Row = Record<string, unknown>>(text: string, values: readonly unknown[] = []): Promise<SqlQueryResult<Row>> => {
    calls.push({ text, values });
    return { rows: [] };
  };
  const sink = new SqlRegistryAuditSink(query);
  const event: RegistryAuditEvent = {
    eventId: "00000000-0000-0000-0000-000000000002",
    eventType: "REGISTRY_ACCESS_DENIED",
    actor: "user-1",
    principalType: "human",
    tenantId: "tenant-1",
    action: "registry.agent-version.read",
    target: "agent:a1:1.0",
    artifactType: "agent",
    artifactId: "a1",
    version: "1.0",
    reasonCode: "REGISTRY_AUTHORIZATION_DENIED",
    createdAt: new Date(0).toISOString(),
  };

  await sink.append(event);

  assert.equal(calls.length, 1);
  assert.match(calls[0]!.text, /INSERT INTO "authorization"\.event/);
  assert.equal(calls[0]!.values[1], "REGISTRY_ACCESS_DENIED");
  assert.equal(calls[0]!.values[4], "tenant-1");
  assert.equal(calls[0]!.values[9], "REGISTRY_AUTHORIZATION_DENIED");
});
