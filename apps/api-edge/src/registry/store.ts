import type {
  AgentIdentity,
  AgentVersion,
  ArtifactIdentity,
  ArtifactVersion,
  LifecycleState,
  PolicyReference,
} from "./types.js";

export interface RegistryStore {
  createArtifact(identity: ArtifactIdentity): Promise<void>;
  getArtifact(artifactType: ArtifactIdentity["artifactType"], artifactId: string): Promise<ArtifactIdentity | undefined>;
  createArtifactVersion(version: ArtifactVersion): Promise<void>;
  getArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string): Promise<ArtifactVersion | undefined>;
  listArtifactVersions(artifactType: ArtifactVersion["artifactType"], artifactId: string): Promise<readonly ArtifactVersion[]>;
  transitionArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string, lifecycleStatus: LifecycleState): Promise<void>;
  createAgent(identity: AgentIdentity): Promise<void>;
  getAgent(agentId: string): Promise<AgentIdentity | undefined>;
  createAgentVersion(version: AgentVersion): Promise<void>;
  getAgentVersion(agentId: string, version: string): Promise<AgentVersion | undefined>;
  listAgentVersions(agentId: string): Promise<readonly AgentVersion[]>;
  transitionAgentVersion(agentId: string, version: string, lifecycleStatus: LifecycleState): Promise<void>;
}

export class InMemoryRegistryStore implements RegistryStore {
  private readonly artifacts = new Map<string, ArtifactIdentity>();
  private readonly artifactVersions = new Map<string, ArtifactVersion>();
  private readonly agents = new Map<string, AgentIdentity>();
  private readonly agentVersions = new Map<string, AgentVersion>();

  async createArtifact(identity: ArtifactIdentity): Promise<void> {
    const key = `${identity.artifactType}:${identity.artifactId}`;
    if (this.artifacts.has(key)) throw new Error("artifact identity already exists");
    this.artifacts.set(key, structuredClone(identity));
  }

  async getArtifact(artifactType: ArtifactIdentity["artifactType"], artifactId: string): Promise<ArtifactIdentity | undefined> {
    const value = this.artifacts.get(`${artifactType}:${artifactId}`);
    return value ? structuredClone(value) : undefined;
  }

  async createArtifactVersion(version: ArtifactVersion): Promise<void> {
    const key = `${version.artifactType}:${version.artifactId}:${version.version}`;
    if (this.artifactVersions.has(key)) throw new Error("artifact version already exists");
    if (!(await this.getArtifact(version.artifactType, version.artifactId))) throw new Error("artifact identity does not exist");
    this.artifactVersions.set(key, structuredClone(version));
  }

  async getArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string): Promise<ArtifactVersion | undefined> {
    const value = this.artifactVersions.get(`${artifactType}:${artifactId}:${version}`);
    return value ? structuredClone(value) : undefined;
  }

  async listArtifactVersions(artifactType: ArtifactVersion["artifactType"], artifactId: string): Promise<readonly ArtifactVersion[]> {
    return [...this.artifactVersions.values()].filter((value) => value.artifactType === artifactType && value.artifactId === artifactId).map((value) => structuredClone(value));
  }

  async transitionArtifactVersion(artifactType: ArtifactVersion["artifactType"], artifactId: string, version: string, lifecycleStatus: LifecycleState): Promise<void> {
    const current = this.artifactVersions.get(`${artifactType}:${artifactId}:${version}`);
    if (!current) throw new Error("artifact version not found");
    current.lifecycleStatus = lifecycleStatus;
  }

  async createAgent(identity: AgentIdentity): Promise<void> {
    const key = `agent:${identity.artifactId}`;
    if (this.artifacts.has(key) || this.agents.has(identity.artifactId)) throw new Error("agent identity already exists");
    const artifact = structuredClone(identity);
    this.artifacts.set(key, artifact);
    this.agents.set(identity.artifactId, structuredClone(identity));
  }

  async getAgent(agentId: string): Promise<AgentIdentity | undefined> {
    const value = this.agents.get(agentId);
    return value ? structuredClone(value) : undefined;
  }

  async createAgentVersion(version: AgentVersion): Promise<void> {
    const key = `${version.agentId}:${version.version}`;
    if (this.agentVersions.has(key)) throw new Error("agent version already exists");
    if (!(await this.getAgent(version.agentId))) throw new Error("agent identity does not exist");
    if (!(await this.getArtifactVersion("agent", version.agentId, version.artifactVersion))) throw new Error("corresponding artifact version does not exist");
    this.agentVersions.set(key, structuredClone(version));
  }

  async getAgentVersion(agentId: string, version: string): Promise<AgentVersion | undefined> {
    const value = this.agentVersions.get(`${agentId}:${version}`);
    return value ? structuredClone(value) : undefined;
  }

  async listAgentVersions(agentId: string): Promise<readonly AgentVersion[]> {
    return [...this.agentVersions.values()].filter((value) => value.agentId === agentId).map((value) => structuredClone(value));
  }

  async transitionAgentVersion(agentId: string, version: string, lifecycleStatus: LifecycleState): Promise<void> {
    const current = this.agentVersions.get(`${agentId}:${version}`);
    if (!current) throw new Error("agent version not found");
    current.lifecycleStatus = lifecycleStatus;
  }
}

export interface PolicyReferenceResolver {
  exists(policy: PolicyReference): boolean;
  isAssignable(policy: PolicyReference, tenantId: string): boolean;
}
