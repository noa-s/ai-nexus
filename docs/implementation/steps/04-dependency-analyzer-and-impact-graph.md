# Step 04 — Dependency Analyzer & Impact Graph

- **Status:** PLANNED
- **Step:** 04
- **Prerequisite:** Step 03 — Artifact, Agent & Version Registry
- **Branch:** `impl/step-04-dependency-analyzer-impact-graph`
- **Requirements baseline:** `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md` v0.7
- **Discovery baseline:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`
- **ADR baseline:** Accepted ADR-001 through ADR-018; relevant ADRs listed below

## 1. Purpose

Step 04 establishes the authoritative Dependency Analyzer and derived Impact Graph required for release safety, supply-chain analysis, reproducibility, and later evaluation/release decisions.

The analyzer derives dependency evidence from repository artifact declarations and registry-compatible metadata. Developers MUST NOT maintain a separate manually edited dependency graph as the correctness source.

The implementation must support deterministic repository scanning, version-to-version dependency edges, direct and transitive impact analysis, changed-artifact detection, dependency/version consistency validation, and PR/CI enforcement.

This step is a **Control Plane** capability. It analyzes versioned artifact relationships; it does not execute Agents, models, tools, RAG, or policies.

## 2. Source-of-truth and traceability

The accepted ADRs remain architectural authority. This document defines the Step 04 implementation contract only.

### Relevant ADRs

- ADR-001 — enterprise platform scope and reusable governed capabilities
- ADR-002 — Control Plane / Execution Plane separation
- ADR-003 — immutable versioned artifacts and automatically derived dependency graph
- ADR-004 — modular/microservice-ready architecture and domain ownership
- ADR-006 — PostgreSQL as authoritative relational store
- ADR-008 — Agent Runtime remains separate from dependency analysis
- ADR-009 — versioned RAG/knowledge lineage
- ADR-010 — immutable versioned policies participate in the dependency graph
- ADR-011 — AI/software supply-chain security and dependency analysis
- ADR-012 — evaluation/release evidence is version-aware
- ADR-013 — causal observability connects executions to artifact/dependency versions
- ADR-014 — version-aware FinOps inputs and historical reproducibility
- ADR-015 — Marketplace consumes version-aware dependency information
- ADR-017 — Auditor can inspect dependency history without mutation authority
- ADR-018 — CI/release enforcement and immutable version identity

### Primary specification requirements

- FR-ART-001 through FR-ART-005
- FR-GOV-001 through FR-GOV-003 where dependency/release evidence participates in governance
- FR-SEC-001 and FR-SEC-002
- FR-EVAL-001 through FR-EVAL-004 where dependency evidence is consumed by evaluation/release decisions
- FR-OBS-001 and FR-OBS-002
- NFR-TRACE-001 and NFR-TRACE-002
- NFR-REL-001
- NFR-SCALE-001
- NFR-MAINT-001 and NFR-MAINT-002
- Specification §9 Artifact and Dependency Model
- Specification §10 Data Architecture / dependency ownership
- Specification §17 Evaluation and release-gate version evidence
- Specification §18 Causal Observability / artifact dependency context
- Specification §21 Traceability and Change Management

## 3. Current repository baseline

Step 03 has established the Artifact/Agent Registry and the language-neutral `DependencyReference` declaration shape. The registry intentionally does not compute a global graph.

The current repository also contains the initial Agent artifact declaration convention:

```text
<agent-name>.artifact.ts
```

Step 04 owns scanning those declarations and deriving the graph.

The implementation roadmap currently records Step 03 as `IN PROGRESS` even though its implementation PR has been merged to `staging` and the post-merge staging CI run succeeded. Step 04 MUST NOT be marked `IN PROGRESS` in the roadmap or begin implementation until Step 03 is formally marked `COMPLETE` according to the roadmap lifecycle.

## 4. Goals

Step 04 MUST provide:

1. deterministic repository discovery of supported artifact declarations;
2. static, non-executing parsing of `<agent-name>.artifact.ts` declarations;
3. validation of declaration schema version and artifact/version identity;
4. extraction of declared dependency references and repository source locations;
5. deterministic construction of version-to-version dependency edges;
6. a derived dependency graph persisted/queryable through the Dependency Graph boundary;
7. direct dependency queries;
8. transitive consumer/impact queries;
9. changed-artifact detection between a base and candidate repository revision;
10. detection of dependency/version inconsistencies before merge;
11. distinction between informational impact and release-blocking enforcement;
12. machine-readable impact/evidence results suitable for CI, Evaluation, Marketplace, Security, and later release-gate consumers;
13. audit/trace evidence for material analyzer and enforcement decisions without storing unnecessary source payloads.

## 5. Non-goals

Step 04 MUST NOT implement:

- Agent Runtime execution/orchestration;
- LLM Gateway or provider access;
- Model Registry;
- RAG retrieval or ingestion;
- Tool/MCP execution;
- Evaluation execution or metric computation;
- Marketplace publication/discovery;
- FinOps calculations;
- runtime authorization decisions;
- a second policy registry;
- a manually maintained graph file;
- execution of repository Agent code to discover dependencies;
- a public graph visualization UI.

A lightweight query API/module is in scope; a UI is not.

## 6. Domain boundary and ownership

The Dependency Graph is a **Control Plane** capability.

It owns:

- derived dependency-edge records;
- graph provenance/evidence metadata;
- graph rebuild metadata and analyzer version;
- impact-analysis query logic and result contracts;
- repository-scan validation results;
- analyzer/release-gate evidence generated by this capability.

It does not own Artifact/Agent Registry records, Policy definitions, Evaluation results, Marketplace state, runtime executions, or source repositories.

The analyzer may read Artifact/Agent Registry information through its explicit registry contract. It MUST NOT directly mutate registry-owned tables.

The derived graph may be persisted in the same PostgreSQL deployment as other domains, but logical ownership remains explicit.

## 7. Artifact and dependency model

A material artifact is addressed as:

```text
(artifactType, artifactId, version)
```

A derived edge MUST preserve at minimum:

```text
sourceArtifactType
sourceArtifactId
sourceVersion
targetArtifactType
targetArtifactId
targetVersion or targetVersionConstraint
relationshipType
consumerOwnerReference
declarationOrigin
sourceRepositoryLocation
analyzerVersion
createdAt
```

The graph MUST preserve version-to-version identity. An artifact-level edge without source/target version context is insufficient for v1 correctness.

The derived edge is evidence, not a new source of truth. The source remains the immutable artifact declaration/metadata from which the edge was derived.

## 8. Supported declaration discovery

The v1 repository scanner MUST discover files matching:

```text
**/*.artifact.ts
```

The scanner MUST use deterministic path ordering and MUST exclude generated/dependency directories such as `.git`, `node_modules`, and build output directories according to repository configuration.

The scanner MUST NOT execute discovered TypeScript modules. It must parse source statically and extract only the supported declaration structure.

For v1, declarations MUST expose `schemaVersion: "1"` and statically inspectable values for:

- artifact identity/type;
- artifact version;
- Agent identity where applicable;
- declared dependencies;
- policy-version references;
- relevant declaration metadata required by the Step 03 contract.

Unsupported or dynamic declaration constructs MUST fail validation rather than being guessed or executed.

## 9. Declaration and registry consistency

For every discovered supported artifact declaration, the analyzer MUST validate:

- declaration schema version is supported;
- artifact type is in the controlled v1 vocabulary;
- artifact identity is stable and syntactically valid;
- declared version is present and canonical under the registry contract;
- declared dependency references satisfy the v1 language-neutral dependency contract;
- repository location is captured;
- where a corresponding registry version is required by the governance rule, declaration identity/version agrees with the authoritative registry record;
- immutable version content is not represented as a different version without explicit registration/version identity change.

The analyzer MUST report mismatches as structured findings with source location and reason code.

## 10. Dependency constraint handling

Step 03 deliberately does not impose Semantic Versioning on the canonical artifact version identifier. Step 04 MUST therefore not infer SemVer ordering or range semantics unless the declaration explicitly uses a supported constraint form.

V1 MUST support exact target-version dependency resolution.

If a dependency supplies a non-exact version constraint that the v1 analyzer cannot safely evaluate, the analyzer MUST preserve the constraint and emit an `UNRESOLVED_CONSTRAINT` finding. It MUST NOT silently treat the dependency as resolved.

Impact/release enforcement MUST be conservative when an unresolved constraint could include a changed target. Such a case is eligible for a blocking CI finding according to the enforcement policy rather than being silently ignored.

## 11. Graph construction

The graph is rebuilt from authoritative declarations/metadata rather than incrementally maintained by developers.

A deterministic rebuild MUST:

1. discover supported declarations;
2. parse and validate declarations;
3. resolve supported dependency references;
4. produce canonical version-to-version edges;
5. attach provenance/source-location metadata;
6. detect duplicate/conflicting declarations;
7. detect missing targets where the dependency is expected to resolve;
8. persist the derived graph as one consistent analyzer result.

A successful rebuild must be reproducible from the same repository revision and registry state.

The implementation MUST prevent stale edges from surviving a successful rebuild. A failed rebuild MUST NOT partially replace a previously valid graph snapshot.

## 12. Impact analysis

The analyzer MUST support at least these queries:

### Direct dependencies

Given an artifact version, return its direct target dependencies.

### Direct consumers

Given an artifact version, return versioned consumers that directly depend on it.

### Transitive consumers / impact

Given an artifact version, traverse reverse edges and return all reachable impacted consumers with causal paths.

The traversal MUST be cycle-safe. Cycles are represented as graph findings; traversal must terminate and must not duplicate nodes indefinitely.

An impact result MUST identify:

- changed/root artifact version;
- impacted artifact/version;
- relationship path;
- direct vs transitive classification;
- edge provenance;
- unresolved/unknown conditions where applicable;
- relevant ownership metadata;
- whether the result is informational or release-blocking under the active enforcement context.

The analyzer MUST preserve path information rather than returning only a flat set of impacted artifacts.

## 13. Change detection

The analyzer MUST accept a repository comparison context consisting of at least:

```text
base revision
candidate revision
repository identity
```

It MUST deterministically identify relevant changed artifact declaration files and relevant metadata/configuration changes that can affect an artifact's dependency evidence.

A repository change affecting a versioned artifact MUST be associated with the declared artifact identity/version discovered in the candidate revision.

At minimum, v1 validation MUST detect:

- changed artifact declaration with unchanged declared version;
- changed dependency declaration under an unchanged version;
- changed policy/dependency metadata represented by a versioned artifact declaration;
- added/removed artifact declarations;
- duplicate artifact identity/version declarations;
- declaration version mismatch against registry evidence where applicable;
- dependency target missing or unresolved;
- unsupported declaration schema/version.

The analyzer SHOULD use repository diff information to narrow the enforcement decision, but graph correctness MUST remain reproducible from a complete candidate-state rebuild.

## 14. Release-safety distinction

Dependency impact information and release blocking are separate concerns.

The analyzer MUST expose structured findings; a CI enforcement adapter decides whether a finding is blocking for the current enforcement context.

Examples of potentially blocking findings include:

- malformed artifact declaration;
- unsupported schema version;
- immutable artifact content changed without version change;
- dependency target cannot be resolved when resolution is required;
- unsupported dependency constraint that may include the changed target;
- duplicate artifact/version identity;
- registry/declaration version mismatch;
- graph rebuild inconsistency.

Informational impact may include a valid dependency change that identifies consumers requiring review, re-evaluation, approval, or deployment consideration but is not itself universally blocking.

The analyzer MUST NOT invent Evaluation or Security release rules. It only supplies evidence and deterministic validation findings; later governance components decide their policy-specific gates.

## 15. Persistence model

PostgreSQL remains the authoritative relational store.

The implementation SHOULD introduce a dependency-owned schema/domain containing at minimum:

- graph snapshot/rebuild identity;
- dependency edges;
- edge provenance/source location;
- analyzer version;
- validation findings where persistence is required for audit/release evidence.

Recommended logical relationships:

```text
GraphSnapshot
  └──< DependencyEdge
  └──< AnalyzerFinding
```

A graph snapshot should be identifiable by repository/revision and analyzer version so historical CI/release evidence can be reconstructed.

The implementation MUST preserve domain ownership and MUST NOT directly mutate Artifact/Agent Registry tables.

## 16. Language-neutral contracts

New externally consumable Dependency Analyzer/Impact Graph contracts MUST be placed under:

```text
packages/contracts/v1
```

At minimum, contracts SHOULD cover:

- dependency edge;
- graph snapshot/rebuild result;
- analyzer finding;
- impact query request;
- impact query result/path;
- CI enforcement result.

Contracts MUST be independently machine-validatable and MUST use stable artifact/version identities rather than database row IDs as the only external references.

## 17. Authorization and security

Dependency analysis is a protected Control Plane operation.

At minimum:

- graph reads are tenant/scope constrained where the graph contains tenant-scoped artifacts;
- mutation/rebuild operations require an authorized platform/service identity;
- Auditor may inspect authorized dependency history and impact evidence without mutation rights;
- repository source paths and artifact metadata are treated as untrusted input;
- source files are parsed statically and never executed by the analyzer;
- repository content must not be interpreted as authorization instructions;
- analyzer failures must fail closed for enforcement rather than silently approving an unsafe change;
- sensitive artifact metadata must not be copied unnecessarily into graph/audit records;
- security/release findings must remain correlated with the analyzer run and repository revision.

The analyzer does not make runtime authorization decisions.

## 18. Observability and audit

Each material analyzer/rebuild/enforcement operation SHOULD preserve:

- analyzer run identifier;
- repository/revision context;
- caller/service identity;
- correlation identifier where available;
- analyzer version;
- graph snapshot identifier;
- result/finding summary;
- timestamp;
- decision/enforcement outcome.

The analyzer MUST provide sufficient evidence to answer:

- what repository revision was analyzed;
- which declaration produced an edge;
- which artifact/version is impacted;
- which path established the impact;
- why CI allowed, warned, or blocked the change.

Sensitive source payloads should be represented by references, hashes, or redacted metadata rather than copied wholesale.

## 19. CI integration

The PR/CI boundary is the authoritative minimum enforcement point required by ADR-003.

The implementation MUST provide a deterministic CI command that can:

1. scan the candidate repository;
2. validate artifact/dependency declarations;
3. rebuild/validate the graph;
4. compare the candidate revision against the base revision;
5. produce machine-readable findings;
6. exit non-zero for configured blocking findings.

A local developer invocation MAY use the same analyzer command. CI and local execution MUST use the same analyzer logic rather than maintaining two implementations.

The analyzer MUST not require network access to LLM providers or execution of Agents to perform dependency analysis.

## 20. Tests and validation

Every new implementation file MUST have focused test coverage or be covered by an explicitly justified integration/contract test.

Required coverage includes:

- deterministic discovery and ordering;
- static parsing without module execution;
- schema-version validation;
- artifact/version identity validation;
- exact dependency resolution;
- unresolved dependency constraints;
- duplicate identity detection;
- changed artifact detection;
- unchanged-version/changed-content detection;
- direct dependency queries;
- direct consumer queries;
- transitive impact traversal;
- cycle handling;
- missing target detection;
- provenance/source-location preservation;
- graph rebuild atomicity/no partial replacement on failure;
- tenant/scope authorization for graph access;
- Auditor read-only behavior;
- fail-closed CI enforcement;
- machine-readable contract validation;
- regression tests proving Step 03 registry boundaries are not mutated directly.

## 21. Acceptance Criteria

- **AC-DEP-001:** Supported artifact declarations are discovered deterministically without executing source modules.
- **AC-DEP-002:** Declaration schema/version and artifact identity/version mismatches produce structured findings.
- **AC-DEP-003:** Derived dependency edges preserve source/target artifact identity, exact versions or supported constraints, relationship type, provenance, ownership, and analyzer metadata.
- **AC-DEP-004:** Graph construction is reproducible for the same repository revision and authoritative registry state.
- **AC-DEP-005:** Successful graph rebuilds replace the derived snapshot atomically; failed rebuilds do not leave a partial graph.
- **AC-DEP-006:** Direct dependency and direct consumer queries are supported.
- **AC-DEP-007:** Transitive impact analysis returns cycle-safe causal paths and distinguishes direct from transitive impact.
- **AC-DEP-008:** Changed versioned artifact content without an appropriate version change is detected before merge.
- **AC-DEP-009:** Missing, duplicate, malformed, or unresolved dependency evidence is surfaced as structured validation findings.
- **AC-DEP-010:** Informational impact is distinct from blocking CI enforcement.
- **AC-DEP-011:** PR/CI execution is deterministic, machine-readable, and fails closed for configured blocking findings.
- **AC-DEP-012:** Graph access respects tenant/scope authorization and Auditor remains read-only.
- **AC-DEP-013:** Analyzer evidence identifies repository revision, analyzer version, graph snapshot, and relevant source/provenance.
- **AC-DEP-014:** New contracts are language-neutral and independently machine-validatable.
- **AC-DEP-015:** No runtime LLM, Agent, Tool, RAG, or provider path is introduced by Step 04.
- **AC-DEP-016:** Dependency analysis can provide evidence consumed later by Evaluation, Security, Marketplace, Observability, and release-gate capabilities without taking ownership of those capabilities.

## 22. Definition of Done

Step 04 may be marked `COMPLETE` only when:

- the Step 04 implementation PR is merged to `staging`;
- all Step 04 acceptance criteria pass;
- focused tests and the full applicable CI suite pass;
- CI verifies deterministic analyzer execution and configured fail-closed enforcement;
- PostgreSQL migration/graph persistence checks pass where applicable;
- security/authorization tests pass;
- the implementation has been independently reviewed against every relevant ADR and the Step 04 contract;
- Step 03 boundaries remain intact and `AI-Nexus-v1-Repository-and-Architecture-Discovery.md` remains untouched;
- staging verification succeeds;
- roadmap and step status are updated with completion evidence.

## 23. Post-implementation review gate

Before Step 04 can be considered complete, perform a fresh review of every changed implementation file against:

1. relevant ADR-001 through ADR-018 decisions, specifically the relevant set listed above;
2. Specification §9 and all referenced FR/NFR requirements;
3. Step 03 registry contracts and domain ownership;
4. security and authorization boundaries;
5. dependency correctness and graph traversal behavior;
6. CI/release enforcement behavior;
7. tests and acceptance evidence.

Any discrepancy returns Step 04 to `IN PROGRESS` until corrected.
