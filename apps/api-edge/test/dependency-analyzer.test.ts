import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { analyzeRepository } from "../src/dependency/analyzer.js";

function repositoryWith(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "ai-nexus-dependency-"));
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    writeFileSync(target, content, "utf8");
  }
  return root;
}

const artifact = (id: string, version: string, dependency = "") => `export const artifact = {
  schemaVersion: "1",
  artifactType: "agent",
  artifactId: "${id}",
  version: "${version}",
  agentId: "${id}",
  dependencies: ${dependency || "[]"},
  policyReferences: [],
  capabilityMetadata: {}
};`;

test("builds version-to-version edges and reports missing repository targets as informational without registry evidence", async () => {
  const root = repositoryWith({
    "a.artifact.ts": artifact("a", "1", `[{
      sourceArtifactType: "agent", sourceArtifactId: "a", sourceVersion: "1",
      targetArtifactType: "tool", targetArtifactId: "tool-x", targetVersion: "2",
      relationshipType: "runtime", consumerOwnerReference: "team-a", declarationOrigin: "a.artifact.ts"
    }]`),
  });

  const snapshot = await analyzeRepository(root, { repository: "test/repo", candidateRevision: "candidate" });
  assert.equal(snapshot.edges.length, 1);
  assert.equal(snapshot.edges[0]?.target.version, "2");
  assert.equal(snapshot.findings.some((item) => item.code === "MISSING_DEPENDENCY_TARGET" && item.severity === "INFO"), true);
});

test("blocks an unchanged artifact version when its declaration content changes", async () => {
  const root = repositoryWith({ "a.artifact.ts": artifact("a", "1") });
  const base = artifact("a", "1", `[{ sourceArtifactType: "agent", sourceArtifactId: "a", sourceVersion: "1", targetArtifactType: "tool", targetArtifactId: "tool-x", targetVersion: "2", relationshipType: "runtime", consumerOwnerReference: "team-a", declarationOrigin: "a.artifact.ts" }]`);

  const snapshot = await analyzeRepository(root, {
    repository: "test/repo",
    baseRevision: "base",
    candidateRevision: "candidate",
  }, {
    changedArtifacts: [{ repositoryPath: "a.artifact.ts", status: "MODIFIED", baseSource: base }],
  });

  assert.equal(snapshot.findings.some((item) => item.code === "VERSION_NOT_BUMPED" && item.severity === "BLOCKING"), true);
});

test("treats unsupported constraints as unresolved rather than guessing version semantics", async () => {
  const root = repositoryWith({
    "a.artifact.ts": artifact("a", "1", `[{
      sourceArtifactType: "agent", sourceArtifactId: "a", sourceVersion: "1",
      targetArtifactType: "tool", targetArtifactId: "tool-x", targetVersionConstraint: ">=2",
      relationshipType: "runtime", consumerOwnerReference: "team-a", declarationOrigin: "a.artifact.ts"
    }]`),
  });

  const snapshot = await analyzeRepository(root, { repository: "test/repo", candidateRevision: "candidate" });
  assert.equal(snapshot.findings.some((item) => item.code === "UNRESOLVED_CONSTRAINT"), true);
});
