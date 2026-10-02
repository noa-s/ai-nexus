import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGraphSnapshot } from "../src/dependency/graph.js";
import { DependencyGraphQueries } from "../src/dependency/queries.js";
import { createDependencyGraphAuthorization, InMemoryDependencyGraphStore } from "../src/dependency/store.js";
import type { DependencyEdge } from "../src/dependency/types.js";

const actor = (subject: string, tenantId: string, roles: string[] = []) => ({ subject, principalType: "human" as const, tenantId, roles });

function edge(owner: string, tenantId?: string): DependencyEdge {
  return {
    edgeId: "edge-1",
    source: { artifactType: "agent", artifactId: "consumer", version: "1" },
    target: { artifactType: "tool", artifactId: "target", version: "1" },
    relationshipType: "runtime",
    consumerOwnerReference: owner,
    declarationOrigin: "consumer.artifact.ts",
    analyzerVersion: "0.1.0",
    tenantId,
  };
}

test("tenant-scoped reads are allowed for matching tenant and denied otherwise", async () => {
  const store = new InMemoryDependencyGraphStore();
  await store.saveSnapshot(buildGraphSnapshot("test/repo", "r1", [edge("owner-a", "tenant-a")], []));
  const queries = new DependencyGraphQueries(store, createDependencyGraphAuthorization());

  const allowed = await queries.getDirectDependencies(actor("owner-a", "tenant-a"), "test/repo", { artifactType: "agent", artifactId: "consumer", version: "1" });
  assert.equal(allowed.length, 1);

  await assert.rejects(() => queries.getDirectDependencies(actor("owner-b", "tenant-b"), "test/repo", { artifactType: "agent", artifactId: "consumer", version: "1" }), /authorization denied/);
});

test("auditor can read evidence but does not gain rebuild capability", () => {
  const authorization = createDependencyGraphAuthorization();
  const auditor = actor("auditor", "tenant-a", ["AUDITOR"]);
  assert.equal(authorization.canRebuild(auditor), false);
  assert.equal(authorization.canRead(auditor, edge("owner-a", "tenant-a")), true);
});
