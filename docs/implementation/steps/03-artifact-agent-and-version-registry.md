# Step 03 — Artifact, Agent & Version Registry

- **Status:** IN PROGRESS
- **Step:** 03
- **Prerequisite:** Step 02 — Identity, Authorization & Policy Foundation
- **Branch:** `impl/step-03-artifact-agent-version-registry`
- **Requirements baseline:** `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md` v0.7
- **Discovery baseline:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`
- **ADR baseline:** Accepted ADR-001 through ADR-018; relevant ADRs listed below

## 1. Purpose

Step 03 establishes the authoritative versioned artifact and Agent registry foundation required before Agent Runtime, Dependency Analyzer, Marketplace, and other governed execution capabilities are implemented.

This step is intentionally a **registry and lifecycle foundation**, not an Agent Runtime implementation and not the Dependency Analyzer implementation.

The registry must make a material artifact addressable by stable identity and immutable version, preserve lifecycle and ownership metadata, and provide explicit references that later execution and dependency-analysis capabilities can consume.

## 2. Source-of-truth and traceability

The accepted ADRs remain the architectural authority. This document defines the implementation contract for Step 03 and must not duplicate ADR rationale.

### Relevant ADRs

- ADR-001 — enterprise platform scope
- ADR-002 — Control Plane / Execution Plane separation
- ADR-003 — immutable versioned artifacts and automatically derived dependency graph
- ADR-004 — modular/microservice-ready architecture and domain ownership
- ADR-005 — Node.js/TypeScript and Python runtime strategy
- ADR-006 — PostgreSQL + pgvector data foundation
- ADR-008 — Agent Runtime separation and governed execution
- ADR-010 — immutable versioned policies and policy dependency references
- ADR-011 — AI security and supply-chain controls
- ADR-013 — causal observability and artifact/version traceability
- ADR-015 — governed Marketplace and Agent Cards
- ADR-017 — RBAC and Auditor access to artifact/version history
- ADR-018 — production deployment/version identity

### Specification requirements

Primary requirements:

- FR-ART-001 through FR-ART-005
- FR-AGT-001 through FR-AGT-003
- FR-EXEC-003
- FR-GOV-001 where artifact/policy references are retained
- FR-OBS-001 and FR-OBS-002 where execution-facing version references are defined
- NFR-TRACE-001 and NFR-TRACE-002
- NFR-MAINT-001 and NFR-MAINT-002

The registry design must also preserve the v1 artifact/dependency model in Specification §9 and the ownership model in Specification §10.

## 3. Current repository baseline / gap

Step 02 has established the identity, authorization, policy registry, audit boundary, PostgreSQL foundation, migration mechanism, shared contracts, and CI baseline.

The current `staging` repository does **not** yet contain an authoritative generic Artifact Registry or Agent Registry. There is also no AgentVersion domain model that downstream execution can resolve.

Step 03 therefore owns the introduction of those registry boundaries. It must build on Step 02 rather than replacing or duplicating its policy/authorization capabilities.

## 4. Goals

Step 03 MUST provide:

1. a generic material Artifact identity/version model;
2. immutable ArtifactVersion records;
3. Agent registration as a governed specialization of the artifact model;
4. immutable AgentVersion records;
5. explicit lifecycle metadata without mutating version content;
6. ownership and tenant/organizational scope metadata;
7. explicit references to immutable policy versions applicable to an AgentVersion;
8. a registry API/module boundary that later runtimes can consume;
9. stable version references suitable for execution records and causal traces;
10. validation and tests proving immutability, uniqueness, lifecycle behavior, authorization, and tenant isolation.

## 5. Non-goals

Step 03 MUST NOT implement:

- the Dependency Analyzer or automatic repository graph computation (Step 04);
- the Model Registry (Step 05);
- Agent Runtime execution/orchestration (Step 08);
- LLM Gateway/provider integration (Step 06);
- RAG or Tool/MCP execution;
- Marketplace publication/discovery UI or conversational discovery (Step 13);
- full production enterprise IdP integration;
- full production observability infrastructure (Step 07);
- broad evaluation/release gates (Step 11).

Step 03 may expose contracts consumed by those later capabilities, but it must not implement their responsibilities prematurely.

## 6. Domain boundaries and ownership

The Artifact/Agent Registry is a **Control Plane** capability.

It owns:

- artifact identity metadata;
- artifact version metadata;
- Agent registration metadata;
- Agent version metadata;
- lifecycle state;
- ownership/business-unit metadata;
- governance references required to determine whether an AgentVersion is eligible for later governed paths;
- explicit immutable dependency/policy references recorded as part of the version metadata.

It does not own:

- policy definitions or policy lifecycle (Policy Registry owns those);
- runtime execution state (Agent Runtime owns that later);
- derived dependency graph computation (Dependency Analyzer owns that later);
- model/provider catalog (Model Registry owns that later);
- Marketplace access decisions or execution authorization.

Other domains MUST access registry information through explicit contracts. They MUST NOT write registry-owned tables directly.

## 7. Artifact identity and version model

A material artifact is addressed as:

```text
(artifactType, artifactId, version)
```

Required invariants:

- `artifactId` is stable across versions;
- `version` uses Semantic Versioning (`MAJOR.MINOR.PATCH`), optionally with a permitted prerelease/build suffix according to the repository's version parser;
- versions are immutable and a given `(artifactType, artifactId, version)` may be registered only once;
- version creation must reject an existing `(artifactType, artifactId, version)` rather than overwrite it;
- a new version MUST use a distinct version identifier when its immutable content changes;
- `(artifactType, artifactId, version)` is unique;
- published/active versions cannot have their immutable content or identity metadata edited;
- a content change requires a new version;
- lifecycle transitions MUST NOT mutate immutable version content;
- historical versions remain queryable;
- version references are explicit rather than inferred from a mutable `latest` pointer.

### Version content

Each ArtifactVersion MUST have a deterministic representation of the versioned artifact metadata/configuration sufficient to identify what was registered. The implementation MAY store normalized relational fields plus a canonical JSON representation, but the immutable representation MUST be sufficient to detect content mutation.

A cryptographic content digest MUST be retained for each immutable version. The digest is computed from the canonical immutable representation used by the registry and MUST remain stable for the lifetime of that version.

### Version conflict rule

A registration request for an existing `(artifactType, artifactId, version)` is rejected. The registry MUST NOT silently replace the existing version, even when the submitted content digest differs.

## 8. Artifact lifecycle

The implementation MUST distinguish immutable version content from mutable lifecycle state.

The initial lifecycle vocabulary is:

```text
DRAFT
  ↓
VALIDATING
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
DEPRECATED
  ↓
ARCHIVED
```

A version may also enter `REVOKED` according to governance/security rules.

The exact transition matrix MUST be explicit in code and tests. Invalid transitions MUST be rejected.

A lifecycle transition changes lifecycle metadata only; it does not change the immutable artifact version content.

The registry MUST NOT interpret `PUBLISHED` as universal execution authorization. Authorization remains the responsibility of the shared authorization/policy boundary.

## 9. Agent model

An Agent is a **specialized Artifact**: every Agent has a corresponding Artifact identity/type, and every AgentVersion is the Agent-specialized form of an ArtifactVersion. Agent-specific metadata extends the generic artifact metadata; it does not create a parallel version identity model.

Minimum Agent identity metadata:

- stable Agent ID;
- human-readable name;
- description;
- owner identity/reference;
- tenant/organization scope;
- business unit where applicable;
- lifecycle status;
- risk classification;
- data classification;
- creation/update metadata.

Minimum AgentVersion metadata:

- Agent ID;
- immutable Semantic Version;
- artifact content/configuration reference;
- content digest;
- lifecycle state;
- creation metadata;
- applicable immutable policy version references;
- declared capability/task metadata;
- declared model/capability constraints where applicable;
- declared tool/capability references where applicable;
- declared knowledge configuration references where applicable;
- evaluation/release status reference;
- deployment status;
- access requirements.

Evaluation status, deployment status, and access requirements are **metadata/references**, not implementations of Evaluation, deployment, or Marketplace capabilities in Step 03.

Step 03 MUST distinguish **registration metadata** from live execution input. A runtime request is not part of the immutable AgentVersion definition.

## 10. Governance eligibility

Registration alone does not make an Agent governed for execution or Marketplace paths.

An AgentVersion is **governed-eligible** only when the registry can establish, according to the applicable governance rules, that:

- the AgentVersion is structurally valid;
- required immutable policy-version references resolve to authoritative Policy Registry versions valid for the intended assignment/context;
- required governance metadata is present;
- lifecycle state permits the requested governed path;
- required evaluation/release evidence is referenced when the applicable release policy requires it;
- required ownership, tenant, risk, and data-classification metadata is present.

The registry records the relevant governance/release status and references; it does not implement the Evaluation Runtime or final runtime authorization. Runtime authorization remains the responsibility of the shared authorization boundary.

`PUBLISHED` MUST NOT by itself be treated as evidence of governance eligibility or execution authorization.

## 11. Policy references

AgentVersion may reference immutable PolicyVersion records owned by the Policy Registry.

The registry MUST store explicit references such as:

```text
policyId
policyVersion
policyType
relationship/context
```

The registry MUST NOT copy the policy definition into the AgentVersion as a second source of truth.

Policy references must be resolvable against the authoritative Policy Registry and must preserve exact version identity for historical reconstruction.

If an AgentVersion references a policy version that is not valid for assignment under the policy lifecycle rules, registration/publication MUST be rejected according to the applicable governance rule.

## 12. Dependency references

Step 03 establishes the **declared version-reference shape** needed by the later Dependency Analyzer. It does not compute the graph.

The authoritative language-neutral declaration contract MUST represent a dependency as:

```text
DependencyReference
- sourceArtifactType
- sourceArtifactId
- sourceVersion
- targetArtifactType
- targetArtifactId
- targetVersion or targetVersionConstraint
- relationshipType
- consumerOwnerReference
- declarationOrigin
- sourceRepositoryLocation (when applicable)
```

`relationshipType` MUST use a controlled vocabulary defined by the implementation contract. At minimum it MUST distinguish a runtime/functional dependency from a governance/policy dependency.

`declarationOrigin` identifies how the dependency was declared (for example, artifact metadata or source artifact declaration), while `sourceRepositoryLocation` identifies the repository/path or equivalent source location when the declaration is repository-backed.

An AgentVersion MAY declare dependencies such as:

```text
AgentVersion
 ├── PolicyVersion
 ├── ToolVersion
 ├── ModelCapabilityVersion
 ├── Prompt/InstructionVersion
 └── KnowledgeConfigurationVersion
```

Each declared dependency MUST contain enough information for Step 04 to later derive a version-to-version dependency edge. The registry MUST NOT maintain a manually edited global dependency graph.

## 13. Agent artifact declaration contract

To preserve the repository convention established by ADR-003, Agent implementations MUST use the initial artifact declaration convention:

```text
<agent-name>.artifact.ts
```

The declaration is the source-level representation that Step 04 will scan deterministically. Step 03 defines its required metadata shape; Step 04 owns scanning and derived graph computation.

The declaration MUST expose, directly or through a statically inspectable exported structure:

```text
artifact identity/type
artifact version
Agent identity
declared dependencies
policy-version references
capability/task metadata
```

The declaration MUST be deterministic and must not require executing an Agent to discover its declared dependency metadata. Runtime-generated dependencies are outside the Step 03 declaration contract and are not replaced by the static declaration.

## 14. Registration and lifecycle operations

The logical registry contract MUST support at minimum:

- create artifact identity;
- create immutable artifact version;
- get artifact identity;
- get exact artifact version;
- list versions within an authorized scope;
- transition version lifecycle state;
- register Agent identity;
- create AgentVersion;
- get exact AgentVersion;
- list authorized Agent versions;
- resolve an exact version reference;
- retrieve declared policy/dependency references.

The contract MUST require explicit version selection for operations that need reproducibility. A generic `latest` lookup MAY exist for discovery/UI convenience but MUST NOT be used as the authoritative execution reference.

## 15. Authorization and security

Registry operations are protected operations.

At minimum:

- creation and lifecycle mutation require an authorized platform role/policy;
- reads are tenant/scope constrained;
- Auditor may inspect authorized artifact/version history without mutation rights;
- cross-tenant artifact visibility is denied unless explicitly authorized by policy;
- registry metadata must not grant runtime execution permission;
- artifact content/configuration supplied by callers is treated as untrusted input and validated before registration;
- secrets must not be embedded in AgentVersion metadata;
- registration/lifecycle decisions must be auditable through the existing audit boundary.

The registry must preserve caller/workload context from Step 02 for security decisions.

## 16. Data model and immutability enforcement

PostgreSQL remains the authoritative relational store.

The logical model SHOULD include at least:

```text
Artifact
  └──< ArtifactVersion

Agent
  └──< AgentVersion

AgentVersion
  ├──< AgentPolicyReference
  └──< DeclaredDependency
```

The implementation MUST preserve logical domain ownership and MUST NOT introduce direct writes from unrelated domains.

Immutable ArtifactVersion/AgentVersion content and identity metadata MUST be protected at the persistence boundary, not only by application code. The implementation MUST provide database-level protection such that:

- UPDATE of immutable version content/identity fields is rejected;
- DELETE of an immutable version is rejected;
- TRUNCATE cannot remove immutable version history through an ordinary table operation;
- lifecycle state and other explicitly mutable lifecycle metadata remain changeable through the defined lifecycle operation;
- historical versions remain queryable after later versions are registered.

Recommended fields are documented as implementation requirements rather than a fixed SQL schema; the implementation may normalize or use JSONB where appropriate, provided the invariants and queryability above are preserved.

## 17. API/module and language-neutral contract

The first implementation may be an in-process TypeScript module/API because v1 logical boundaries do not require separate deployment units.

The registry boundary MUST be language-neutral. Node.js/TypeScript implementation types MUST NOT be the only contract consumed by later Python consumers or separately deployed services.

The language-neutral registry contracts MUST be defined under `packages/contracts/v1` and MUST cover, at minimum:

```text
Artifact / ArtifactVersion
Agent / AgentVersion
DependencyReference
registry request/response shapes for exact lookup and registration/lifecycle operations
```

The contract format MUST be independently machine-validatable (for example JSON Schema or the repository's established language-neutral schema mechanism), and contract tests MUST validate representative payloads without importing TypeScript domain implementation types.

The contract MUST expose stable identifiers and explicit versions, not database row IDs as the only external identity.

## 18. Observability and audit

Material registry mutations MUST produce auditable events containing sufficient context to establish:

- actor/workload reference;
- tenant/scope;
- operation;
- artifact/Agent identity;
- exact version where applicable;
- previous and resulting lifecycle state where applicable;
- request/trace correlation;
- decision/policy references where applicable.

Reads of sensitive registry history by Auditor must remain auditable under the Step 02 evidence boundary.

Registry records themselves are not the complete causal execution trace; Step 07 will integrate registry references into the broader execution trace.

## 19. Testing and validation

Dedicated tests MUST exist for every new/updated implementation module, following the lesson established during Step 02.

Required coverage includes:

### Artifact/version invariants

- duplicate identity/version rejected;
- immutable version content cannot be changed;
- immutable identity metadata cannot be changed;
- content digest remains stable;
- lifecycle transition does not mutate immutable content;
- invalid lifecycle transitions rejected;
- historical versions remain queryable;
- exact version lookup does not silently resolve to `latest`.

### Agent registry

- Agent identity registration;
- AgentVersion registration;
- duplicate AgentVersion rejection;
- policy reference validation;
- declared dependency validation;
- governance eligibility validation;
- tenant/scope isolation;
- authorized read/list behavior;
- unauthorized access rejection.

### Security/governance

- unauthorized registration rejected;
- unauthorized lifecycle mutation rejected;
- Auditor read allowed within scope;
- Auditor mutation denied;
- registry mutation generates an audit event;
- invalid/untrusted metadata rejected;
- secret-like fields are rejected or excluded according to the repository's security contract.

### Contract tests

Language-neutral registry request/response schemas MUST be validated independently of TypeScript implementation types. Tests MUST also validate the static `.artifact.ts` declaration shape used as the Step 04 dependency-analysis input.

## 20. Acceptance criteria

Step 03 is accepted only when:

1. Artifact and Agent registry boundaries are implemented and explicitly owned.
2. Material artifacts are addressable by stable identity and immutable Semantic Version.
3. AgentVersion is a governed versioned artifact rather than mutable configuration.
4. Lifecycle transitions are explicit and tested.
5. Policy references point to exact authoritative Policy Registry versions without duplicating policy definitions.
6. Declared dependency references provide the input shape required by Step 04 without creating a manually maintained global graph.
7. The initial `<agent-name>.artifact.ts` declaration contract is defined and statically inspectable.
8. Registry operations enforce tenant/scope authorization using the Step 02 authorization boundary.
9. Auditor access is read-oriented, scoped, and auditable.
10. PostgreSQL persistence enforces immutable version content/identity at the database boundary.
11. Agent metadata supports ownership, risk/data classification, capabilities, model/tool/knowledge references, evaluation/release status, deployment status, and access requirements without implementing those later capabilities.
12. Governance eligibility is explicit and is not implied solely by `PUBLISHED`.
13. Every new/updated implementation module has dedicated meaningful test coverage.
14. Language-neutral contracts are independently machine-validated.
15. CI passes all applicable Node/Python/database/repository safety checks.
16. No Step 04/05/06/08+ capability is silently implemented as part of this step.

## 21. Definition of Done

- [ ] Relevant ADRs re-read from the implementation branch.
- [ ] Step 03 implementation is complete within this scope.
- [ ] Dedicated tests exist for every new/updated implementation module.
- [ ] Contract schemas are independently validated.
- [ ] Static `.artifact.ts` declaration shape is tested.
- [ ] PostgreSQL migrations apply cleanly from the current staging baseline.
- [ ] Database-level immutability protections are tested for UPDATE/DELETE/TRUNCATE behavior.
- [ ] Authorization/security tests pass.
- [ ] Governance eligibility rules are tested.
- [ ] Audit behavior is verified.
- [ ] CI passes.
- [ ] Implementation is reviewed against every relevant ADR and this specification after implementation, not only before coding.
- [ ] Discovery §5 is updated against the resulting repository state after the step is merged.
- [ ] PR is merged to `staging`.
- [ ] Merged `staging` state is verified.
- [ ] Step 03 is then marked `COMPLETE` in the roadmap.

## 22. Explicit review gate

Before Step 03 can be declared complete, perform a fresh comparison of:

```text
Every changed implementation file
        ↓
Step 03 requirements and acceptance criteria
        ↓
Relevant accepted ADRs individually
        ↓
Actual tests and CI evidence
        ↓
Current staging repository state
```

The review MUST actively look for missing requirements, stale assumptions, indirect-only test coverage, boundary violations, and accidental scope expansion. A passing build alone is insufficient evidence of completion.
