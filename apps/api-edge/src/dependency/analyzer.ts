import { createHash } from "node:crypto";
import type { ArtifactType, DependencyReference } from "../registry/types.js";
import { ARTIFACT_TYPES } from "../registry/types.js";
import { dependencyReferenceToEdge, buildGraphSnapshot } from "./graph.js";
import { scanArtifactDeclarations, type ParsedArtifactDeclaration } from "./scanner.js";
import type { AnalyzerFinding, AnalyzerRunContext, DependencyEdge, DependencyNode, GraphSnapshot, RegistryEvidenceResolver } from "./types.js";

export type ChangedArtifact = {
  repositoryPath: string;
  status: "ADDED" | "MODIFIED" | "DELETED";
  baseSource?: string;
};

export type DependencyAnalyzerOptions = {
  registryEvidence?: RegistryEvidenceResolver;
  changedArtifacts?: readonly ChangedArtifact[];
};

function validArtifactType(value: string): value is ArtifactType {
  return (ARTIFACT_TYPES as readonly string[]).includes(value);
}

function nodeFromDeclaration(declaration: ParsedArtifactDeclaration["declaration"]): DependencyNode {
  return { artifactType: declaration.artifactType, artifactId: declaration.artifactId, version: declaration.version };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function declarationDigest(declaration: ParsedArtifactDeclaration["declaration"]): string {
  return digest(JSON.stringify(declaration));
}

function finding(severity: AnalyzerFinding["severity"], code: AnalyzerFinding["code"], message: string, parsed?: ParsedArtifactDeclaration, dependency?: DependencyReference): AnalyzerFinding {
  return {
    severity,
    code,
    message,
    repositoryPath: parsed?.repositoryPath,
    artifact: parsed ? nodeFromDeclaration(parsed.declaration) : undefined,
    dependency,
  };
}

function validateDependency(parsed: ParsedArtifactDeclaration, dependency: DependencyReference): AnalyzerFinding | undefined {
  if (!validArtifactType(dependency.sourceArtifactType) || !validArtifactType(dependency.targetArtifactType)) {
    return finding("BLOCKING", "INVALID_DEPENDENCY_REFERENCE", "dependency references an unsupported artifact type", parsed, dependency);
  }

  if (dependency.sourceArtifactType !== parsed.declaration.artifactType || dependency.sourceArtifactId !== parsed.declaration.artifactId || dependency.sourceVersion !== parsed.declaration.version) {
    return finding("BLOCKING", "SOURCE_DECLARATION_MISMATCH", "dependency source identity/version does not match its declaring artifact", parsed, dependency);
  }

  if ((dependency.targetVersion === undefined) === (dependency.targetVersionConstraint === undefined)) {
    return finding("BLOCKING", "INVALID_DEPENDENCY_REFERENCE", "dependency must contain exactly one targetVersion or targetVersionConstraint", parsed, dependency);
  }

  if (!dependency.consumerOwnerReference) return finding("BLOCKING", "INVALID_DEPENDENCY_REFERENCE", "dependency consumer owner reference is required", parsed, dependency);
  if (!dependency.declarationOrigin) return finding("BLOCKING", "INVALID_DEPENDENCY_REFERENCE", "dependency declaration origin is required", parsed, dependency);

  if (dependency.targetVersionConstraint !== undefined) {
    return finding("WARNING", "UNRESOLVED_CONSTRAINT", "v1 does not infer non-exact version constraints; the dependency remains unresolved", parsed, dependency);
  }

  return undefined;
}

export async function analyzeRepository(repositoryRoot: string, context: AnalyzerRunContext, options: DependencyAnalyzerOptions = {}): Promise<GraphSnapshot> {
  const scan = scanArtifactDeclarations(repositoryRoot);
  const findings: AnalyzerFinding[] = scan.failures.map((failure) => ({
    severity: failure.message.includes("unsupported declaration schema") ? "BLOCKING" : "BLOCKING",
    code: failure.message.includes("schema version") ? "UNSUPPORTED_SCHEMA_VERSION" : "INVALID_DECLARATION",
    message: failure.message,
    repositoryPath: failure.repositoryPath,
    line: failure.line,
    column: failure.column,
  }));

  const byIdentity = new Map<string, ParsedArtifactDeclaration>();
  const edges: DependencyEdge[] = [];

  for (const parsed of scan.declarations) {
    const node = nodeFromDeclaration(parsed.declaration);
    const identity = `${node.artifactType}:${node.artifactId}@${node.version}`;
    if (byIdentity.has(identity)) {
      findings.push(finding("BLOCKING", "DUPLICATE_ARTIFACT_VERSION", `duplicate artifact version declaration: ${identity}`, parsed));
      continue;
    }
    byIdentity.set(identity, parsed);

    for (const dependency of parsed.declaration.dependencies) {
      const validation = validateDependency(parsed, dependency);
      if (validation) findings.push(validation);
      if (validation?.code === "INVALID_DEPENDENCY_REFERENCE" || validation?.code === "SOURCE_DECLARATION_MISMATCH") continue;

      const edge = dependencyReferenceToEdge(dependency);
      const evidence = options.registryEvidence ? await options.registryEvidence.resolve(edge.target) : undefined;
      if (options.registryEvidence && !evidence && dependency.targetVersion !== undefined) {
        findings.push(finding("BLOCKING", "MISSING_DEPENDENCY_TARGET", `dependency target is not present in authoritative registry evidence: ${dependency.targetArtifactType}:${dependency.targetArtifactId}@${dependency.targetVersion}`, parsed, dependency));
      }
      if (evidence && (evidence.ownerRef !== dependency.consumerOwnerReference || evidence.artifactType !== edge.target.artifactType || evidence.artifactId !== edge.target.artifactId || evidence.version !== edge.target.version)) {
        findings.push(finding("BLOCKING", "INVALID_DEPENDENCY_REFERENCE", "registry evidence is inconsistent with the dependency target", parsed, dependency));
      }
      edges.push({ ...edge, tenantId: evidence?.tenantId });
    }
  }

  const declarationByPath = new Map(scan.declarations.map((item) => [item.repositoryPath, item]));
  for (const changed of options.changedArtifacts ?? []) {
    const candidate = declarationByPath.get(changed.repositoryPath);
    if (changed.status === "DELETED") {
      findings.push({ severity: "WARNING", code: "INVALID_DECLARATION", message: `artifact declaration was deleted: ${changed.repositoryPath}`, repositoryPath: changed.repositoryPath });
      continue;
    }
    if (!candidate) continue;
    if (changed.status === "MODIFIED" && changed.baseSource !== undefined) {
      try {
        const baseScan = scanArtifactText(changed.baseSource, changed.repositoryPath);
        if (baseScan.artifactId === candidate.declaration.artifactId && baseScan.version === candidate.declaration.version) {
          const baseDigest = declarationDigest(baseScan);
          const candidateDigest = declarationDigest(candidate.declaration);
          if (baseDigest !== candidateDigest) {
            findings.push(finding("BLOCKING", "VERSION_NOT_BUMPED", `versioned artifact content changed without changing version: ${candidate.declaration.artifactId}@${candidate.declaration.version}`, candidate));
          }
        }
      } catch {
        findings.push(finding("BLOCKING", "INVALID_DECLARATION", `base revision declaration could not be parsed: ${changed.repositoryPath}`, candidate));
      }
    }
  }

  const targetKeys = new Set(edges.map((edge) => edge.targetVersionConstraint ? `${edge.target.artifactType}:${edge.target.artifactId}` : `${edge.target.artifactType}:${edge.target.artifactId}@${edge.target.version}`));
  for (const edge of edges) {
    if (edge.targetVersionConstraint) continue;
    const targetKey = `${edge.target.artifactType}:${edge.target.artifactId}@${edge.target.version}`;
    if (!byIdentity.has(targetKey) && !options.registryEvidence) {
      findings.push({ severity: "INFO", code: "MISSING_DEPENDENCY_TARGET", message: `dependency target is not declared in the scanned repository: ${targetKey}`, artifact: edge.source, dependency: {
        sourceArtifactType: edge.source.artifactType,
        sourceArtifactId: edge.source.artifactId,
        sourceVersion: edge.source.version,
        targetArtifactType: edge.target.artifactType,
        targetArtifactId: edge.target.artifactId,
        targetVersion: edge.target.version,
        relationshipType: edge.relationshipType,
        consumerOwnerReference: edge.consumerOwnerReference,
        declarationOrigin: edge.declarationOrigin,
        sourceRepositoryLocation: edge.sourceRepositoryLocation,
      } });
    }
  }

  void targetKeys;
  return buildGraphSnapshot(context.repository, context.candidateRevision, edges, findings);
}

function scanArtifactText(sourceText: string, repositoryPath: string): ParsedArtifactDeclaration["declaration"] {
  const source = scanArtifactTextModule(sourceText, repositoryPath);
  return source;
}

function scanArtifactTextModule(sourceText: string, repositoryPath: string): ParsedArtifactDeclaration["declaration"] {
  const { parseArtifactDeclarationText } = requireScanner();
  return parseArtifactDeclarationText(sourceText, repositoryPath);
}

function requireScanner(): typeof import("./scanner.js") {
  // Static import indirection keeps this module's public surface small while remaining ESM-safe.
  return scannerModule;
}

import * as scannerModule from "./scanner.js";
