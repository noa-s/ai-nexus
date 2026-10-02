import assert from "node:assert/strict";
import { test } from "node:test";
import { SqlDependencyGraphStore } from "../src/dependency/sql-store.js";
import type { GraphSnapshot } from "../src/dependency/types.js";

function snapshot(): GraphSnapshot {
  return {
    snapshotId: "snapshot-1",
    repository: "test/repo",
    revision: "r1",
    analyzerVersion: "0.1.0",
    createdAt: "2026-10-03T00:00:00.000Z",
    edges: [{
      edgeId: "edge-1",
      source: { artifactType: "agent", artifactId: "consumer", version: "1" },
      target: { artifactType: "tool", artifactId: "tool", version: "2" },
      relationshipType: "runtime",
      consumerOwnerReference: "team-a",
      declarationOrigin: "consumer.artifact.ts",
      analyzerVersion: "0.1.0",
    }],
    findings: [],
  };
}

test("persists exact dependency targets without converting them to database row identity", async () => {
  const calls: Array<{ text: string; values?: readonly unknown[] }> = [];
  const store = new SqlDependencyGraphStore(async (text, values) => {
    calls.push({ text, values });
    return { rows: [] };
  });

  await store.saveSnapshot(snapshot());
  assert.equal(calls.length, 1);
  const values = calls[0]?.values ?? [];
  const edges = JSON.parse(String(values[1])) as Array<Record<string, unknown>>;
  assert.equal(edges[0]?.target_version, "2");
  assert.equal(edges[0]?.target_version_constraint, null);
});
