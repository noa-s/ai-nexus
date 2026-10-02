import type { IdentityContext } from "../auth/types.js";
import { directConsumers, directDependencies, impactAnalysis } from "./graph.js";
import type { DependencyGraphAuthorization, DependencyGraphStore, DependencyNode, ImpactPath } from "./types.js";

export class DependencyGraphQueries {
  constructor(private readonly store: DependencyGraphStore, private readonly authorization: DependencyGraphAuthorization) {}

  async getLatest(actor: IdentityContext, repository: string) {
    const snapshot = await this.store.getLatestSnapshot(repository);
    if (!snapshot) return undefined;
    return this.filterSnapshot(actor, snapshot);
  }

  async getDirectDependencies(actor: IdentityContext, repository: string, source: DependencyNode) {
    const snapshot = await this.requireAuthorizedSnapshot(actor, repository);
    return directDependencies(snapshot, source).filter((edge) => this.authorization.canRead(actor, edge));
  }

  async getDirectConsumers(actor: IdentityContext, repository: string, target: DependencyNode) {
    const snapshot = await this.requireAuthorizedSnapshot(actor, repository);
    return directConsumers(snapshot, target).filter((edge) => this.authorization.canRead(actor, edge));
  }

  async getImpact(actor: IdentityContext, repository: string, root: DependencyNode): Promise<readonly ImpactPath[]> {
    const snapshot = await this.requireAuthorizedSnapshot(actor, repository);
    return impactAnalysis(snapshot, root).filter((impact) => {
      const edges = snapshot.edges.filter((edge) => impact.path.some((node) => node.artifactId === edge.source.artifactId && node.version === edge.source.version));
      return edges.every((edge) => this.authorization.canRead(actor, edge));
    });
  }

  private async requireAuthorizedSnapshot(actor: IdentityContext, repository: string) {
    const snapshot = await this.store.getLatestSnapshot(repository);
    if (!snapshot) throw new Error("dependency graph snapshot not found");
    return this.filterSnapshot(actor, snapshot);
  }

  private filterSnapshot(actor: IdentityContext, snapshot: NonNullable<Awaited<ReturnType<DependencyGraphStore["getLatestSnapshot"]>>>) {
    const edges = snapshot.edges.filter((edge) => this.authorization.canRead(actor, edge));
    if (edges.length === 0 && snapshot.edges.length > 0) throw new Error("dependency graph authorization denied");
    return { ...snapshot, edges };
  }
}
