import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGraphSnapshot, impactAnalysis, directConsumers, directDependencies } from "../src/dependency/graph.js";
import type { DependencyEdge, DependencyNode } from "../src/dependency/types.js";

const node = (artifactId: string, version: string): DependencyNode => ({ artifactType: "agent", artifactId, version });
const edge = (source: DependencyNode, target: DependencyNode, owner: string): DependencyEdge => ({
  edgeId: `${source.artifactId}-${target.artifactId}`,
  source,
  target,
  relationshipType: "runtime",
  consumerOwnerReference: owner,
  declarationOrigin: "test.artifact.ts",
  analyzerVersion: "0.1.0",
});

test("returns direct dependencies and consumers", () => {
  const a = node("a", "1");
  const b = node("b", "1");
  const e = edge(a, b, "team-a");
  const snapshot = buildGraphSnapshot("test/repo", "r1", [e], []);

  assert.equal(directDependencies(snapshot, a).length, 1);
  assert.equal(directConsumers(snapshot, b).length, 1);
});

test("returns transitive causal impact paths and terminates on cycles", () => {
  const a = node("a", "1");
  const b = node("b", "1");
  const c = node("c", "1");
  const snapshot = buildGraphSnapshot("test/repo", "r1", [
    edge(a, b, "team-a"),
    edge(b, c, "team-b"),
    edge(c, a, "team-c"),
  ], []);

  const impacts = impactAnalysis(snapshot, c);
  const impactedIds = impacts.map((item) => item.impacted.artifactId);
  assert.deepEqual(impactedIds.sort(), ["a", "b"]);
  assert.equal(impacts.some((item) => item.classification === "DIRECT"), true);
  assert.equal(impacts.some((item) => item.classification === "TRANSITIVE"), true);
});
