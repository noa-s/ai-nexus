import assert from "node:assert/strict";
import test from "node:test";
import { SqlRegistryAuditSink } from "../src/registry/sql-audit.js";
import type { SqlQueryResult } from "../src/registry/sql-store.js";

test("SQL audit adapter persists lifecycle transition context without changing the Step 02 schema", async () => {
  let values: readonly unknown[] = [];
  const query = async <Row = Record<string, unknown>>(_text: string, nextValues: readonly unknown[] = []): Promise<SqlQueryResult<Row>> => {
    values = nextValues;
    return { rows: [] };
  };
  const sink = new SqlRegistryAuditSink(query);
  await sink.append({
    eventId: "00000000-0000-0000-0000-000000000003",
    eventType: "REGISTRY_MUTATION",
    actor: "user-1",
    principalType: "human",
    tenantId: "tenant-1",
    action: "registry.agent-version.lifecycle",
    target: "agent:a1:1.0",
    artifactType: "agent",
    artifactId: "a1",
    version: "1.0",
    previousLifecycleStatus: "DRAFT",
    resultingLifecycleStatus: "VALIDATING",
    reasonCode: "REGISTRY_MUTATION_ALLOWED",
    createdAt: new Date(0).toISOString(),
  });

  assert.equal(values[7], "agent:a1:1.0;lifecycle:DRAFT->VALIDATING");
});
