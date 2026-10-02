import type {
  AgentIdentity,
  AgentVersion,
  ArtifactIdentity,
  ArtifactVersion,
  DependencyReference,
  LifecycleState,
  PolicyReference,
} from "./types.js";

export interface RegistryStore {
  createArtifact(identity: ArtifactIdentity): void;
  getArtifact(artifactType: ArtifactIdentity["artifactType"], artifactId: string): ArtifactIdentity | undefined;
  createArtifactVersion(version: ArtifactVersion): void;
  getArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string): ArtifactVersion | undefined;
  listArtifactVersions(artifactType: ArtifactVersion["artifactType"], artifactId: string): readonly ArtifactVersion[];
  transitionArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string, lifecycleStatus: LifecycleState): void;
  createAgent(identity: AgentIdentity): void;
  getAgent(agentId: string): AgentIdentity | undefined;
  createAgentVersion(version: AgentVersion): void;
  getAgentVersion(agentId: string, version: string): AgentVersion | undefined;
  listAgentVersions(agentId: string): readonly AgentVersion[];
  transitionAgentVersion(agentId: string, version: string, lifecycleStatus: LifecycleState): void;
}

export class InMemoryRegistryStore implements RegistryStore {
  private readonly artifacts = new Map<string, ArtifactIdentity>();
  private readonly artifactVersions = new Map<string, ArtifactVersion>();
  private readonly agents = new Map<string, AgentIdentity>();
  private readonly agentVersions = new Map<string, AgentVersion>();

  createArtifact(identity: ArtifactIdentity): void {
    const key = `${identity.artifactType}:${identity.artifactId}`;
    if (this.artifacts.has(key)) throw new Error("artifact identity already exists");
    this.artifacts.set(key, structuredClone(identity));
  }

  getArtifact(artifactType: ArtifactIdentity["artifactType"], artifactId: string): ArtifactIdentity | undefined {
    const value = this.artifacts.get(`${artifactType}:${artifactId}`);
    return value ? structuredClone(value) : undefined;
  }

  createArtifactVersion(version: ArtifactVersion): void {
    const key = `${version.artifactType}:${version.artifactId}:${version.version}`;
    if (this.artifactVersions.has(key)) throw new Error("artifact version already exists");
    if (!this.getArtifact(version.artifactType, version.artifactId)) throw new Error("artifact identity does not exist");
    this.artifactVersions.set(key, structuredClone(version));
  }

  getArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string): ArtifactVersion | undefined {
    const value = this.artifactVersions.get(`${artifactType}:${artifactId}:${version}`);
    return value ? structuredClone(value) : undefined;
  }

  listArtifactVersions(artifactType: ArtifactVersion["artifactType"], artifactId: string): readonly ArtifactVersion[] {
    return [...this.artifactVersions.values()]
      .filter((value) => value.artifactType === artifactType && value.artifactId === artifactId)
      .map((value) => structuredClone(value));
  }

  transitionArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string, lifecycleStatus: LifecycleState): void {
    const key = `${artifactType}:${artifactId}:${version}`;
    const current = this.artifactVersions.get(key);
    if (!current) throw new Error("artifact version not found");
    current.lifecycleStatus = lifecycleStatus;
  }

  createAgent(identity: AgentIdentity): void {
    if (this.agents.has(identity.artifactId)) throw new Error("agent identity already exists");
    if (!this.getArtifact("agent", identity.artifactId)) throw new Error("agent artifact identity does not exist");
    this.agents.set(identity.artifactId, structuredClone(identity));
  }

  getAgent(agentId: string): AgentIdentity | undefined {
    const value = this.agents.get(agentId);
    return value ? structuredClone(value) : undefined;
  }

  createAgentVersion(version: AgentVersion): void {
    const key = `${version.agentId}:${version.version}`;
    if (this.agentVersions.has(key)) throw new Error("agent version already exists");
    if (!this.getAgent(version.agentId)) throw new Error("agent identity does not exist");
    const artifactVersion = this.getArtifactVersion("agent", version.agentId, version.artifactVersion);
    if (!artifactVersion) throw new Error("corresponding artifact version does not exist");
    this.agentVersions.set(key, structuredClone(version));
  }

  getAgentVersion(agentId: string, version: string): AgentVersion | undefined {
    const value = this.agentVersions.get(`${agentId}:${version}`);
    return value ? structuredClone(value) : undefined;
  }

  listAgentVersions(agentId: string): readonly AgentVersion[] {
    return [...this.agentVersions.values()]
      .filter((value) => value.agentId === agentId)
      .map((value) => structuredClone(value));
  }

  transitionAgentVersion(agentId: string, version: string, lifecycleStatus: LifecycleState): void {
    const current = this.agentVersions.get(`${agentId}:${version}`);
    if (!current) throw new Error("agent version not found");
    current.lifecycleStatus = lifecycleStatus;
  }
}

export interface PolicyReferenceResolver {
  exists(policy: PolicyReference): boolean;
  isAssignable(policy: PolicyReference, tenantId: string): boolean;
}
