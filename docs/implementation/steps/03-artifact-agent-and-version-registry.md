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
- `version` uniquely identifies an immutable version within an artifact identity;
- `(artifactType, artifactId, version)` is unique;
- published/active versions cannot have their immutable content or identity metadata edited;
- a content change requires a new version;
- lifecycle transitions MUST NOT mutate immutable version content;
- historical versions remain queryable;
- version references are explicit rather than inferred from a mutable `latest` pointer.

### Version content

Each ArtifactVersion MUST have a deterministic representation of the versioned artifact metadata/configuration sufficient to identify what was registered. The implementation MAY store normalized relational fields plus a canonical JSON representation, but the immutable representation MUST be sufficient to detect content mutation.

A content digest SHOULD be retained so later systems can verify artifact identity independently of mutable metadata.

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

An Agent is a governed material artifact specialization.

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
- immutable version;
- artifact content/configuration reference;
- content digest;
- lifecycle state;
- creation metadata;
- applicable immutable policy version references;
- declared capability/task metadata;
- declared model/capability constraints where applicable;
- declared tool/capability references where applicable;
- declared knowledge configuration references where applicable;
- evaluation/release status reference where available, without making Evaluation a Step 03 dependency.

Step 03 MUST distinguish **registration metadata** from live execution input. A runtime request is not part of the immutable AgentVersion definition.

## 10. Policy references

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

## 11. Dependency references

Step 03 establishes the **declared version-reference shape** needed by the later Dependency Analyzer. It does not compute the graph.

An AgentVersion MAY declare dependencies such as:

```text
AgentVersion
 ├── PolicyVersion
 ├── ToolVersion
 ├── ModelCapabilityVersion
 ├── Prompt/InstructionVersion
 └── KnowledgeConfigurationVersion
```

Each declared dependency MUST contain enough information for Step 04 to later derive a version-to-version dependency edge, including:

- source artifact identity/version;
- target artifact identity/version or explicit version constraint;
- relationship type;
- declaration origin/source metadata.

The registry MUST NOT maintain a manually edited global dependency graph.

## 12. Registration and lifecycle operations

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

## 13. Authorization and security

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

## 14. Data model

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

Recommended fields are documented as implementation requirements rather than a fixed SQL schema; the implementation may normalize or use JSONB where appropriate, provided the invariants and queryability above are preserved.

## 15. API/module contract

The first implementation may be an in-process TypeScript module/API because v1 logical boundaries do not require separate deployment units.

The contract MUST be language-neutral at the boundary so later Python consumers or separately deployed services can consume registry data without importing Node.js implementation details.

The contract MUST expose stable identifiers and explicit versions, not database row IDs as the only external identity.

## 16. Observability and audit

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

## 17. Testing and validation

Dedicated tests MUST exist for every new/updated implementation module, following the lesson established during Step 02.

Required coverage includes:

### Artifact/version invariants

- duplicate identity/version rejected;
- immutable version content cannot be changed;
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

Language-neutral registry request/response schemas MUST be validated independently of TypeScript implementation types.

## 18. Acceptance criteria

Step 03 is accepted only when:

1. Artifact and Agent registry boundaries are implemented and explicitly owned.
2. Material artifacts are addressable by stable identity and immutable version.
3. AgentVersion is a governed versioned artifact rather than mutable configuration.
4. Lifecycle transitions are explicit and tested.
5. Policy references point to exact authoritative Policy Registry versions without duplicating policy definitions.
6. Declared dependency references provide the input shape required by Step 04 without creating a manually maintained global graph.
7. Registry operations enforce tenant/scope authorization using the Step 02 authorization boundary.
8. Auditor access is read-oriented, scoped, and auditable.
9. PostgreSQL persistence respects domain ownership and immutability requirements.
10. Every new/updated implementation module has dedicated meaningful test coverage.
11. Language-neutral contracts are validated independently of implementation code.
12. CI passes all applicable Node/Python/database/repository safety checks.
13. No Step 04/05/06/08+ capability is silently implemented as part of this step.

## 19. Definition of Done

- [ ] Relevant ADRs re-read from the implementation branch.
- [ ] Step 03 implementation is complete within this scope.
- [ ] Dedicated tests exist for every new/updated implementation module.
- [ ] Contract schemas are independently validated.
- [ ] PostgreSQL migrations apply cleanly from the current staging baseline.
- [ ] Authorization/security tests pass.
- [ ] Audit behavior is verified.
- [ ] CI passes.
- [ ] Implementation is reviewed against every relevant ADR and this specification after implementation, not only before coding.
- [ ] Discovery §5 is updated against the resulting repository state after the step is merged.
- [ ] PR is merged to `staging`.
- [ ] Merged `staging` state is verified.
- [ ] Step 03 is then marked `COMPLETE` in the roadmap.

## 20. Explicit review gate

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
