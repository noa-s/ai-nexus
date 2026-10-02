import type { ArtifactDeclaration } from "../../src/registry/types.js";

export const maintenanceAgentArtifact: ArtifactDeclaration = {
  schemaVersion: "1",
  artifactType: "agent",
  artifactId: "maintenance-agent",
  version: "1",
  agentId: "maintenance-agent",
  declaredCapabilities: ["maintenance"],
  declaredTasks: ["diagnose"],
  policyReferences: [],
  dependencies: [],
};
