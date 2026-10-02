import type { AgentArtifactDeclaration } from "../../src/registry/types.js";

export const exampleAgentArtifact = {
  schemaVersion: "1",
  artifactType: "agent",
  artifactId: "example-agent",
  version: "1.0",
  agentId: "example-agent",
  dependencies: [
    {
      sourceArtifactType: "agent",
      sourceArtifactId: "example-agent",
      sourceVersion: "1.0",
      targetArtifactType: "tool",
      targetArtifactId: "example-tool",
      targetVersion: "2.0",
      relationshipType: "runtime",
      consumerOwnerReference: "team-example",
      declarationOrigin: "example-agent.artifact.ts",
      sourceRepositoryLocation: "apps/api-edge/test/fixtures/example-agent.artifact.ts",
    },
  ],
  policyReferences: [],
  capabilityMetadata: { tasks: ["example"] },
} satisfies AgentArtifactDeclaration;
