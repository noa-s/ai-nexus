import { createHash } from "node:crypto";
import type { DependencyReference } from "../registry/types.js";
import type { AnalyzerFinding, DependencyEdge, DependencyNode, GraphSnapshot, ImpactPath } from "./types.js";
import { ANALYZER_VERSION } from "./types.js";

export function nodeKey(node: DependencyNode): string {
  return `${node.artifactType}:${node.artifactId}@${node.version}`;
}

export function edgeKey(edge: Pick<DependencyEdge, "source" | "target" | "targetVersionConstraint" | "relationshipType">): string {
  return [nodeKey(edge.source), nodeKey(edge.target), edge.targetVersionConstraint ?? "", edge.relationshipType].join("->");
}

export function createSnapshotId(repository: string, revision: string, edges: readonly DependencyEdge[], findings: readonly AnalyzerFinding[]): string {
  const canonical = JSON.stringify({ repository, revision, analyzerVersion: ANALYZER_VERSION, edges, findings });
  return createHash("sha256").update(canonical).digest("hex");
}

export function buildGraphSnapshot(repository: string, revision: string, edges: readonly DependencyEdge[], findings: readonly AnalyzerFinding[]): GraphSnapshot {
  const sortedEdges = [...edges].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  const sortedFindings = [...findings].sort((a, b) => `${a.code}:${a.repositoryPath ?? ""}:${a.message}`.localeCompare(`${b.code}:${b.repositoryPath ?? ""}:${b.message}`));
  return {
    snapshotId: createSnapshotId(repository, revision, sortedEdges, sortedFindings),
    repository,
    revision,
    analyzerVersion: ANALYZER_VERSION,
    edges: sortedEdges,
    findings: sortedFindings,
    createdAt: new Date().toISOString(),
  };
}

function adjacency(edges: readonly DependencyEdge[]): Map<string, DependencyEdge[]> {
  const result = new Map<string, DependencyEdge[]>();
  for (const edge of edges) {
    const key = nodeKey(edge.target);
    const consumers = result.get(key) ?? [];
    consumers.push(edge);
    result.set(key, consumers);
  }
  for (const list of result.values()) list.sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  return result;
}

export function directDependencies(snapshot: GraphSnapshot, source: DependencyNode): readonly DependencyEdge[] {
  return snapshot.edges.filter((edge) => nodeKey(edge.source) === nodeKey(source));
}

export function directConsumers(snapshot: GraphSnapshot, target: DependencyNode): readonly DependencyEdge[] {
  return snapshot.edges.filter((edge) => nodeKey(edge.target) === nodeKey(target));
}

export function impactAnalysis(snapshot: GraphSnapshot, root: DependencyNode): readonly ImpactPath[] {
  const reverse = adjacency(snapshot.edges);
  const results: ImpactPath[] = [];
  const queue: Array<{ node: DependencyNode; path: DependencyNode[]; edges: DependencyEdge[] }> = [
    { node: root, path: [root], edges: [] },
  ];
  const bestDepth = new Map<string, number>([[nodeKey(root), 0]]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const incoming = reverse.get(nodeKey(current.node)) ?? [];

    for (const edge of incoming) {
      const consumerKey = nodeKey(edge.source);
      const nextPath = [...current.path, edge.source];
      const nextEdges = [...current.edges, edge];
      const depth = nextPath.length - 1;

      if (current.path.some((node, index) => index < current.path.length - 1 && nodeKey(node) === consumerKey)) {
        continue;
      }

      const previousDepth = bestDepth.get(consumerKey);
      if (previousDepth !== undefined && previousDepth <= depth) continue;
      bestDepth.set(consumerKey, depth);

      const hasUnresolvedConstraint = nextEdges.some((item) => item.targetVersionConstraint !== undefined);
      results.push({
        root,
        impacted: edge.source,
        path: nextPath,
        classification: hasUnresolvedConstraint ? "POSSIBLE" : depth === 1 ? "DIRECT" : "TRANSITIVE",
        relationshipTypes: nextEdges.map((item) => item.relationshipType),
        ownerReferences: nextEdges.map((item) => item.consumerOwnerReference),
        evidence: nextEdges.map((item) => item.sourceRepositoryLocation ?? item.declarationOrigin),
      });

      queue.push({ node: edge.source, path: nextPath, edges: nextEdges });
    }
  }

  return results.sort((a, b) => `${nodeKey(a.impacted)}:${a.classification}`.localeCompare(`${nodeKey(b.impacted)}:${b.classification}`));
}

export function dependencyReferenceToEdge(reference: DependencyReference, analyzerVersion = ANALYZER_VERSION, tenantId?: string): DependencyEdge {
  if (!reference.targetVersion && !reference.targetVersionConstraint) throw new Error("dependency reference must provide a target version or constraint");
  if (reference.targetVersion && reference.targetVersionConstraint) throw new Error("dependency reference cannot provide both targetVersion and targetVersionConstraint");

  const source: DependencyNode = {
    artifactType: reference.sourceArtifactType as DependencyNode["artifactType"],
    artifactId: reference.sourceArtifactId,
    version: reference.sourceVersion,
  };
  const target: DependencyNode = {
    artifactType: reference.targetArtifactType as DependencyNode["artifactType"],
    artifactId: reference.targetArtifactId,
    version: reference.targetVersion ?? reference.targetVersionConstraint!,
  };
  const edge = {
    edgeId: edgeKey({ source, target, targetVersionConstraint: reference.targetVersionConstraint, relationshipType: reference.relationshipType }),
    source,
    target,
    targetVersionConstraint: reference.targetVersionConstraint,
    relationshipType: reference.relationshipType,
    consumerOwnerReference: reference.consumerOwnerReference,
    sourceRepositoryLocation: reference.sourceRepositoryLocation,
    declarationOrigin: reference.declarationOrigin,
    analyzerVersion,
    tenantId,
  } satisfies DependencyEdge;
  return edge;
}
