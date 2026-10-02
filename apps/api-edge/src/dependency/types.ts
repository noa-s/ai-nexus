import type { IdentityContext } from "../auth/types.js";
import type { DependencyReference, ArtifactType } from "../registry/types.js";

export const ANALYZER_VERSION = "0.1.0" as const;

export type DependencyNode = {
  artifactType: ArtifactType;
  artifactId: string;
  version: string;
};

export type DependencyEdge = {
  edgeId: string;
  source: DependencyNode;
  target: DependencyNode;
  targetVersionConstraint?: string;
  relationshipType: DependencyReference["relationshipType"];
  consumerOwnerReference: string;
  sourceRepositoryLocation?: string;
  declarationOrigin: string;
  analyzerVersion: string;
  tenantId?: string;
};

export type AnalyzerFindingSeverity = "INFO" | "WARNING" | "BLOCKING";

export type AnalyzerFindingCode =
  | "INVALID_DECLARATION"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "INVALID_ARTIFACT_TYPE"
  | "INVALID_ARTIFACT_IDENTITY"
  | "DECLARATION_VERSION_MISMATCH"
  | "VERSION_NOT_BUMPED"
  | "DUPLICATE_ARTIFACT_VERSION"
  | "MISSING_DEPENDENCY_TARGET"
  | "UNRESOLVED_CONSTRAINT"
  | "SOURCE_DECLARATION_MISMATCH"
  | "INVALID_DEPENDENCY_REFERENCE"
  | "GRAPH_REBUILD_FAILED";

export type AnalyzerFinding = {
  code: AnalyzerFindingCode;
  severity: AnalyzerFindingSeverity;
  message: string;
  repositoryPath?: string;
  line?: number;
  column?: number;
  artifact?: DependencyNode;
  dependency?: DependencyReference;
};

export type GraphSnapshot = {
  snapshotId: string;
  repository: string;
  revision: string;
  analyzerVersion: string;
  edges: readonly DependencyEdge[];
  findings: readonly AnalyzerFinding[];
  createdAt: string;
};

export type ImpactClassification = "DIRECT" | "TRANSITIVE" | "POSSIBLE" | "UNRESOLVED";

export type ImpactPath = {
  root: DependencyNode;
  impacted: DependencyNode;
  path: readonly DependencyNode[];
  classification: ImpactClassification;
  relationshipTypes: readonly DependencyReference["relationshipType"][];
  ownerReferences: readonly string[];
  evidence: readonly string[];
};

export type AnalyzerRunContext = {
  repository: string;
  baseRevision?: string;
  candidateRevision: string;
};

export type DependencyGraphAuthorization = {
  canRead(actor: IdentityContext, edge: DependencyEdge): boolean;
  canRebuild(actor: IdentityContext): boolean;
};

export type DependencyGraphStore = {
  saveSnapshot(snapshot: GraphSnapshot): Promise<void>;
  getLatestSnapshot(repository: string): Promise<GraphSnapshot | undefined>;
  getSnapshot(snapshotId: string): Promise<GraphSnapshot | undefined>;
};

export type RegistryVersionEvidence = {
  artifactType: ArtifactType;
  artifactId: string;
  version: string;
  tenantId: string;
  ownerRef: string;
};

export type RegistryEvidenceResolver = {
  resolve(artifact: DependencyNode): Promise<RegistryVersionEvidence | undefined>;
};
