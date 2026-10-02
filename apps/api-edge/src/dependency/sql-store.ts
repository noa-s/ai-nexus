import type { DependencyEdge, DependencyGraphStore, GraphSnapshot } from "./types.js";
import { ANALYZER_VERSION } from "./types.js";

export interface DependencySqlQueryResult<Row> { rows: Row[]; }
export type DependencySqlExecutor = <Row = Record<string, unknown>>(text: string, values?: readonly unknown[]) => Promise<DependencySqlQueryResult<Row>>;

export class SqlDependencyGraphStore implements DependencyGraphStore {
  constructor(private readonly query: DependencySqlExecutor) {}

  async saveSnapshot(snapshot: GraphSnapshot): Promise<void> {
    await this.query(
      `BEGIN;
       INSERT INTO dependency.graph_snapshot (snapshot_id, repository, revision, analyzer_version, created_at)
       VALUES ($1,$2,$3,$4,$5);
       DELETE FROM dependency.dependency_edge WHERE snapshot_id = $1;
       INSERT INTO dependency.dependency_edge
         (snapshot_id, edge_id, source_artifact_type, source_artifact_id, source_version,
          target_artifact_type, target_artifact_id, target_version, target_version_constraint,
          relationship_type, consumer_owner_reference, declaration_origin, source_repository_location,
          analyzer_version, tenant_id)
       SELECT $1, edge_id, source_artifact_type, source_artifact_id, source_version,
          target_artifact_type, target_artifact_id, target_version, target_version_constraint,
          relationship_type, consumer_owner_reference, declaration_origin, source_repository_location,
          analyzer_version, tenant_id
       FROM jsonb_to_recordset($2::jsonb) AS e(
          edge_id text, source_artifact_type text, source_artifact_id text, source_version text,
          target_artifact_type text, target_artifact_id text, target_version text, target_version_constraint text,
          relationship_type text, consumer_owner_reference text, declaration_origin text,
          source_repository_location text, analyzer_version text, tenant_id text
       );
       INSERT INTO dependency.analyzer_finding (snapshot_id, code, severity, message, repository_path, line, column, artifact, dependency)
       SELECT $1, code, severity, message, repository_path, line, column, artifact, dependency
       FROM jsonb_to_recordset($3::jsonb) AS f(
          code text, severity text, message text, repository_path text, line integer, column integer,
          artifact jsonb, dependency jsonb
       );
       COMMIT;`,
      [snapshot.snapshotId, JSON.stringify(snapshot.edges.map(serializeEdge)), JSON.stringify(snapshot.findings)],
    );
  }

  async getLatestSnapshot(repository: string): Promise<GraphSnapshot | undefined> {
    const result = await this.query<SnapshotRow>(
      `SELECT snapshot_id, repository, revision, analyzer_version, created_at FROM dependency.graph_snapshot
       WHERE repository = $1 ORDER BY created_at DESC LIMIT 1`,
      [repository],
    );
    return result.rows[0] ? this.readSnapshot(result.rows[0]) : undefined;
  }

  async getSnapshot(snapshotId: string): Promise<GraphSnapshot | undefined> {
    const result = await this.query<SnapshotRow>(
      `SELECT snapshot_id, repository, revision, analyzer_version, created_at FROM dependency.graph_snapshot
       WHERE snapshot_id = $1`,
      [snapshotId],
    );
    return result.rows[0] ? this.readSnapshot(result.rows[0]) : undefined;
  }

  private async readSnapshot(row: SnapshotRow): Promise<GraphSnapshot> {
    const [edgesResult, findingsResult] = await Promise.all([
      this.query<EdgeRow>(`SELECT * FROM dependency.dependency_edge WHERE snapshot_id = $1 ORDER BY edge_id`, [row.snapshot_id]),
      this.query<FindingRow>(`SELECT code, severity, message, repository_path, line, column, artifact, dependency FROM dependency.analyzer_finding WHERE snapshot_id = $1 ORDER BY finding_id`, [row.snapshot_id]),
    ]);

    return {
      snapshotId: row.snapshot_id,
      repository: row.repository,
      revision: row.revision,
      analyzerVersion: row.analyzer_version || ANALYZER_VERSION,
      edges: edgesResult.rows.map(deserializeEdge),
      findings: findingsResult.rows.map((item) => ({
        code: item.code as never,
        severity: item.severity as never,
        message: item.message,
        repositoryPath: item.repository_path ?? undefined,
        line: item.line ?? undefined,
        column: item.column ?? undefined,
        artifact: item.artifact ?? undefined,
        dependency: item.dependency ?? undefined,
      })),
      createdAt: row.created_at,
    };
  }
}

type SnapshotRow = { snapshot_id: string; repository: string; revision: string; analyzer_version: string; created_at: string };
type EdgeRow = Record<string, unknown> & {
  edge_id: string; source_artifact_type: string; source_artifact_id: string; source_version: string;
  target_artifact_type: string; target_artifact_id: string; target_version: string | null; target_version_constraint: string | null;
  relationship_type: string; consumer_owner_reference: string; declaration_origin: string;
  source_repository_location: string | null; analyzer_version: string; tenant_id: string | null;
};
type FindingRow = { code: string; severity: string; message: string; repository_path: string | null; line: number | null; column: number | null; artifact: never; dependency: never };

function serializeEdge(edge: DependencyEdge) {
  return {
    edge_id: edge.edgeId,
    source_artifact_type: edge.source.artifactType,
    source_artifact_id: edge.source.artifactId,
    source_version: edge.source.version,
    target_artifact_type: edge.target.artifactType,
    target_artifact_id: edge.target.artifactId,
    target_version: edge.targetVersionConstraint ? null : edge.target.version,
    target_version_constraint: edge.targetVersionConstraint ?? null,
    relationship_type: edge.relationshipType,
    consumer_owner_reference: edge.consumerOwnerReference,
    declaration_origin: edge.declarationOrigin,
    source_repository_location: edge.sourceRepositoryLocation ?? null,
    analyzer_version: edge.analyzerVersion,
    tenant_id: edge.tenantId ?? null,
  };
}

function deserializeEdge(row: EdgeRow): DependencyEdge {
  return {
    edgeId: row.edge_id,
    source: { artifactType: row.source_artifact_type as DependencyEdge["source"]["artifactType"], artifactId: row.source_artifact_id, version: row.source_version },
    target: { artifactType: row.target_artifact_type as DependencyEdge["target"]["artifactType"], artifactId: row.target_artifact_id, version: row.target_version ?? row.target_version_constraint ?? "" },
    targetVersionConstraint: row.target_version_constraint ?? undefined,
    relationshipType: row.relationship_type as DependencyEdge["relationshipType"],
    consumerOwnerReference: row.consumer_owner_reference,
    declarationOrigin: row.declaration_origin,
    sourceRepositoryLocation: row.source_repository_location ?? undefined,
    analyzerVersion: row.analyzer_version,
    tenantId: row.tenant_id ?? undefined,
  };
}
