import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArtifactDeclarationText } from "../src/dependency/scanner.js";

test("parses a literal artifact declaration without executing module code", () => {
  const declaration = parseArtifactDeclarationText(`
    export const artifact = {
      schemaVersion: "1",
      artifactType: "agent",
      artifactId: "maintenance-agent",
      version: "1.0.0",
      agentId: "maintenance-agent",
      dependencies: [{
        sourceArtifactType: "agent",
        sourceArtifactId: "maintenance-agent",
        sourceVersion: "1.0.0",
        targetArtifactType: "tool",
        targetArtifactId: "diagnostics-tool",
        targetVersion: "2.0.0",
        relationshipType: "runtime",
        consumerOwnerReference: "operations",
        declarationOrigin: "maintenance-agent.artifact.ts"
      }],
      policyReferences: [],
      capabilityMetadata: { tasks: ["diagnose"] }
    } satisfies Record<string, unknown>;
  `);

  assert.equal(declaration.artifactId, "maintenance-agent");
  assert.equal(declaration.dependencies[0]?.targetArtifactId, "diagnostics-tool");
});

test("rejects dynamic expressions instead of executing them", () => {
  assert.throws(() => parseArtifactDeclarationText(`
    const dynamic = process.env.AGENT_VERSION;
    export const artifact = {
      schemaVersion: "1",
      artifactType: "agent",
      artifactId: "unsafe",
      version: dynamic,
      agentId: "unsafe",
      dependencies: [],
      policyReferences: [],
      capabilityMetadata: {}
    };
  `), /unsupported non-literal declaration expression/);
});
