import type { IdentityContext } from "../auth/types.js";
import type { DependencyEdge, DependencyGraphAuthorization, DependencyGraphStore, GraphSnapshot } from "./types.js";

export class InMemoryDependencyGraphStore implements DependencyGraphStore {
  private readonly snapshots = new Map<string, GraphSnapshot>();
  private readonly latestByRepository = new Map<string, string>();

  async saveSnapshot(snapshot: GraphSnapshot): Promise<void> {
    this.snapshots.set(snapshot.snapshotId, snapshot);
    this.latestByRepository.set(snapshot.repository, snapshot.snapshotId);
  }

  async getLatestSnapshot(repository: string): Promise<GraphSnapshot | undefined> {
    const id = this.latestByRepository.get(repository);
    return id ? this.snapshots.get(id) : undefined;
  }

  async getSnapshot(snapshotId: string): Promise<GraphSnapshot | undefined> {
    return this.snapshots.get(snapshotId);
  }
}

export function createDependencyGraphAuthorization(): DependencyGraphAuthorization {
  return {
    canRead(actor: IdentityContext, edge: DependencyEdge): boolean {
      if (edge.tenantId !== undefined) return edge.tenantId === actor.tenantId;
      return edge.consumerOwnerReference === actor.subject || actor.roles.includes("ADMINISTRATOR") || actor.roles.includes("AUDITOR");
    },
    canRebuild(actor: IdentityContext): boolean {
      return actor.roles.includes("ADMINISTRATOR") || actor.roles.includes("AI_BUILDER");
    },
  };
}
