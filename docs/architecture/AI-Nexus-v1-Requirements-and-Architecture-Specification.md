# AI Nexus v1 — Requirements & Architecture Specification

- **Status:** Draft — Stage 3B.2
- **Version:** 0.2
- **Date:** 2026-10-02
- **Architectural baseline:** Accepted ADR-001 through ADR-018

## 1. Purpose and Authority

This document defines the **v1 requirements and concrete architecture specification** for AI Nexus. It translates accepted architectural decisions into implementable requirements, interfaces, boundaries, data contracts, acceptance criteria, and delivery constraints.

The ADRs remain the authoritative source for architectural decisions. This document MUST NOT duplicate ADR rationale or restate an ADR as a second source of truth.

### 1.1 Architectural authority

The authoritative decisions are maintained in:

- [ADR-001 — Enterprise AI Platform Scope](../adr/ADR-001-enterprise-ai-platform-scope.md)
- [ADR-002 — Control Plane vs Execution Plane](../adr/ADR-002-control-execution-planes.md)
- [ADR-003 — Immutable Versioned Artifacts](../adr/ADR-003-immutable-versioned-artifacts.md)
- [ADR-004 — Modular Microservice-Ready Architecture](../adr/ADR-004-modular-microservice-ready-architecture.md)
- [ADR-005 — TypeScript/Python Runtime Strategy](../adr/ADR-005-polyglot-runtime-typescript-python.md)
- [ADR-006 — PostgreSQL + pgvector](../adr/ADR-006-postgresql-pgvector.md)
- [ADR-007 — LLM Gateway and Model Routing](../adr/ADR-007-llm-gateway-model-routing.md)
- [ADR-008 — Agent Runtime](../adr/ADR-008-agent-runtime.md)
- [ADR-009 — RAG and Knowledge Versioning](../adr/ADR-009-rag-and-knowledge-versioning.md)
- [ADR-010 — Immutable Versioned Policies](../adr/ADR-010-immutable-versioned-policies.md)
- [ADR-011 — AI Security Architecture](../adr/ADR-011-ai-security-architecture.md)
- [ADR-012 — AI Evaluation](../adr/ADR-012-ai-evaluation.md)
- [ADR-013 — Observability and Causal Tracing](../adr/ADR-013-observability-and-causal-tracing.md)
- [ADR-014 — AI FinOps and Business Value](../adr/ADR-014-ai-finops-and-business-value.md)
- [ADR-015 — AI Marketplace](../adr/ADR-015-ai-marketplace.md)
- [ADR-016 — Microsoft Ecosystem / Copilot Studio Integration](../adr/ADR-016-microsoft-ecosystem-integration.md)
- [ADR-017 — RBAC and Auditor Role](../adr/ADR-017-rbac-and-auditor-role.md)
- [ADR-018 — Production Deployment and IaC](../adr/ADR-018-production-deployment-and-iac.md)

If an ADR changes, this specification MUST be reviewed for affected requirements, interfaces, constraints, and acceptance criteria. The specification does not silently override an accepted ADR.

### 1.2 Working method

```text
Inspect
  ↓
Compare with accepted ADRs
  ↓
Identify gaps / ambiguities
  ↓
Discuss / decide
  ↓
Update specification
  ↓
Commit
  ↓
Proceed to next specification section
```

### 1.3 Normative language

- **MUST** — required for v1.
- **SHOULD** — expected unless an explicit reason is documented.
- **MAY** — optional capability.
- **FUTURE** — intentionally outside v1 unless scope is later changed.

---

# 2. System Goals

The goals below define what the v1 platform must achieve; the architectural mechanisms used to achieve them are defined by the referenced ADRs.

| ID | Goal | Architectural basis |
|---|---|---|
| G-001 | Provide a governed enterprise AI execution path. | ADR-001, ADR-002, ADR-010, ADR-011, ADR-017 |
| G-002 | Provide reusable platform capabilities for AI execution and lifecycle management. | ADR-001, ADR-004 |
| G-003 | Make material AI systems versioned, traceable, and reproducible. | ADR-003, ADR-009, ADR-010, ADR-012, ADR-013 |
| G-004 | Enable safe enterprise adoption without each team independently implementing core controls. | ADR-001, ADR-011, ADR-017 |
| G-005 | Make reliability, security, observability, evaluation, cost, and business value first-class platform concerns. | ADR-011 through ADR-014 |
| G-006 | Decouple applications from individual LLM providers. | ADR-007 |
| G-007 | Provide organization-wide AI enablement through reusable governed capabilities. | ADR-001, ADR-015, ADR-016 |
| G-008 | Demonstrate production-oriented engineering practices. | ADR-018 |

---

# 3. System Non-Goals

| ID | Non-goal | Boundary / authority |
|---|---|---|
| NG-001 | Implement every possible enterprise AI use case. | v1 is a platform foundation; domain-specific breadth is future scope. |
| NG-002 | Immediately deploy every logical capability as an independent microservice. | ADR-004, ADR-018 |
| NG-003 | Replace Microsoft tenant/organizational governance. | ADR-016 |
| NG-004 | Allow an LLM or Agent to become an authorization authority. | ADR-010, ADR-011, ADR-017 |
| NG-005 | Promise fixed AI execution pricing. | ADR-014, ADR-015 |
| NG-006 | Treat embeddings as the authoritative knowledge source. | ADR-009 |
| NG-007 | Build a public commercial AI marketplace in v1. | ADR-015 |
| NG-008 | Require provider-specific LLM integrations in consuming applications. | ADR-007 |
| NG-009 | Introduce operational complexity without a concrete v1 requirement. | ADR-004, ADR-018 |

---

# 4. Personas and Primary Use Cases

Personas establish requirements for the platform surface; authorization semantics remain governed by ADR-010 and ADR-017.

| Persona | Primary platform need |
|---|---|
| Executive | Business-level AI visibility and value evidence |
| Business leader / manager | Governed AI capabilities for decisions and workflows |
| Business user | Discover and use approved AI capabilities |
| Developer / application engineer | Build applications and Agents using platform capabilities |
| AI / ML engineer | Build, evaluate, and operate AI systems |
| Data scientist | Evaluation, experimentation, knowledge and model analysis |
| Platform engineer | Operate services, deployment, reliability and integrations |
| Security / governance | Policy, risk, security and compliance visibility |
| Auditor | Scoped read-only investigation and evidence access |
| AI Nexus service identity | Governed machine-to-machine execution |
| External integration | Controlled access through the API/Edge boundary |

### Primary use cases

- **UC-001:** Discover an approved AI capability through the governed Marketplace.
- **UC-002:** Invoke a registered Agent through the governed API/Edge path.
- **UC-003:** Create, version, evaluate, and register an Agent artifact.
- **UC-004:** Retrieve enterprise knowledge through governed RAG with provenance.
- **UC-005:** Propose and execute a governed Tool/MCP action.
- **UC-006:** Route an LLM request through the Gateway and Model Router.
- **UC-007:** Evaluate an AI capability and use results as release/production signals.
- **UC-008:** Investigate an execution using causal observability and audit evidence.
- **UC-009:** Analyze AI usage, cost, and available business-value evidence.
- **UC-010:** Invoke AI Nexus from Copilot Studio through the defined integration boundary.

---

# 5. Functional Requirements

The requirements below define **observable platform behavior**. They reference ADRs instead of reproducing their architectural rationale.

## 5.1 Identity and authorization

- **FR-IAM-001:** Protected operations MUST authenticate the caller identity.
- **FR-IAM-002:** Authorization MUST use the RBAC baseline defined by ADR-017.
- **FR-IAM-003:** Authorization MUST support applicable policy constraints defined by ADR-010.
- **FR-IAM-004:** Authorization MUST be enforceable at relevant execution/action boundaries, not only at ingress.
- **FR-IAM-005:** Auditor access MUST remain scoped and read-oriented.

**Basis:** [ADR-010](../adr/ADR-010-immutable-versioned-policies.md), [ADR-017](../adr/ADR-017-rbac-and-auditor-role.md)

## 5.2 Artifact lifecycle and dependency management

- **FR-ART-001:** Material AI artifacts MUST have immutable versions.
- **FR-ART-002:** Material dependencies MUST be representable in the dependency graph.
- **FR-ART-003:** Dependency information MUST be derived from declared/observable artifact metadata rather than maintained manually as the primary source.
- **FR-ART-004:** The platform MUST identify downstream artifacts affected by a dependency change.
- **FR-ART-005:** Runtime records MUST retain references to relevant artifact versions.

**Basis:** [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md)

## 5.3 Agent management

- **FR-AGT-001:** The platform MUST provide an Agent registry.
- **FR-AGT-002:** Agents MUST be versioned artifacts.
- **FR-AGT-003:** Agent registration MUST capture the metadata required by the applicable lifecycle, governance, dependency, evaluation, and deployment contracts.
- **FR-AGT-004:** Only registered/governed Agents may enter the governed Marketplace/runtime path.

**Basis:** [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md), [ADR-008](../adr/ADR-008-agent-runtime.md), [ADR-015](../adr/ADR-015-ai-marketplace.md)

## 5.4 LLM access and routing

- **FR-LLM-001:** Runtime LLM access MUST pass through the LLM Gateway.
- **FR-LLM-002:** Provider-specific integrations MUST be encapsulated by provider adapters.
- **FR-LLM-003:** Model routing MUST enforce hard constraints before optimization.
- **FR-LLM-004:** The routing contract MUST support the decision inputs required by the accepted routing architecture.
- **FR-LLM-005:** Runtime usage metadata MUST be captured for observability and FinOps where available.

**Basis:** [ADR-007](../adr/ADR-007-llm-gateway-model-routing.md)

## 5.5 Agent, RAG, and Tool execution

- **FR-EXEC-001:** Agent execution MUST remain separated from LLM, RAG, and Tool/MCP responsibilities.
- **FR-EXEC-002:** LLM-generated actions MUST be treated as proposals and MUST not directly authorize execution.
- **FR-EXEC-003:** Execution identity and causal correlation MUST propagate through runtime operations.
- **FR-EXEC-004:** Applicable policy and authorization MUST be enforced at action boundaries.
- **FR-RAG-001:** Governed knowledge MUST preserve source/document/chunk lineage.
- **FR-RAG-002:** Embeddings MUST retain their source/chunk and embedding configuration/version relationship.
- **FR-RAG-003:** Retrieval MUST apply applicable authorization/data-access controls.
- **FR-RAG-004:** Retrieval results MUST expose provenance sufficient to identify the relevant source/document version.
- **FR-TOOL-001:** Tools/MCP capabilities MUST have governed registration and identity.
- **FR-TOOL-002:** Tool proposals MUST undergo authorization/policy evaluation before execution.
- **FR-TOOL-003:** Tool credentials MUST remain outside model context.
- **FR-TOOL-004:** Tool execution MUST appear in the causal execution record.

**Basis:** [ADR-008](../adr/ADR-008-agent-runtime.md), [ADR-009](../adr/ADR-009-rag-and-knowledge-versioning.md), [ADR-010](../adr/ADR-010-immutable-versioned-policies.md), [ADR-011](../adr/ADR-011-ai-security-architecture.md)

## 5.6 Evaluation

- **FR-EVAL-001:** Evaluation configurations and material inputs MUST be version-aware.
- **FR-EVAL-002:** Evaluation MUST support pre-production release decisions.
- **FR-EVAL-003:** Evaluation MUST support production monitoring.
- **FR-EVAL-004:** Evaluation results MUST retain versions of material inputs.
- **FR-EVAL-005:** The v1 evaluation implementation MUST define deterministic metrics where sufficient and identify where semantic evaluation is required.

**Basis:** [ADR-012](../adr/ADR-012-ai-evaluation.md)

## 5.7 Observability and audit

- **FR-OBS-001:** Each AI execution MUST have a causal trace.
- **FR-OBS-002:** Trace context MUST propagate across logical service boundaries.
- **FR-OBS-003:** Material events and decisions MUST preserve causal relationships.
- **FR-OBS-004:** Traces MUST retain relevant artifact and policy versions.
- **FR-OBS-005:** Observability data MUST support access, redaction, and retention controls.

**Basis:** [ADR-013](../adr/ADR-013-observability-and-causal-tracing.md), [ADR-017](../adr/ADR-017-rbac-and-auditor-role.md)

## 5.8 FinOps and business value

- **FR-FIN-001:** The platform MUST collect/consume model usage metadata sufficient for cost accounting where available.
- **FR-FIN-002:** Pricing configurations MUST be versioned.
- **FR-FIN-003:** Cost MUST be attributable across defined organizational and execution dimensions.
- **FR-FIN-004:** Platform cost, workflow operational cost, and business value MUST remain distinguishable.
- **FR-FIN-005:** Business-value evidence MUST distinguish measured, observed, and estimated values.

**Basis:** [ADR-014](../adr/ADR-014-ai-finops-and-business-value.md)

## 5.9 Marketplace

- **FR-MKT-001:** The platform MUST provide governed discovery of registered AI capabilities.
- **FR-MKT-002:** Marketplace visibility MUST respect discovery permissions.
- **FR-MKT-003:** Conversational discovery MUST NOT grant access.
- **FR-MKT-004:** Marketplace execution MUST use the governed authorization/execution path.
- **FR-MKT-005:** Marketplace records MUST remain version-aware.

**Basis:** [ADR-015](../adr/ADR-015-ai-marketplace.md)

## 5.10 Microsoft / Copilot Studio

- **FR-MS-001:** Copilot Studio integration MUST enter through the defined external API/Edge boundary.
- **FR-MS-002:** Copilot Studio MUST NOT directly bypass internal runtime services.
- **FR-MS-003:** Microsoft authentication MUST NOT substitute for AI Nexus authorization.
- **FR-MS-004:** Documentation MUST distinguish AI Nexus controls from Microsoft tenant/organizational enforcement.

**Basis:** [ADR-016](../adr/ADR-016-microsoft-ecosystem-integration.md)

## 5.11 Deployment and lifecycle

- **FR-DEP-001:** v1 MUST support environment separation.
- **FR-DEP-002:** Deployment artifacts MUST be immutable/versioned.
- **FR-DEP-003:** Runtime services MUST expose health/readiness information appropriate to their deployment model.
- **FR-DEP-004:** Infrastructure MUST be reproducible through Terraform/IaC.
- **FR-DEP-005:** CI/CD MUST enforce defined dependency, security, evaluation, and release gates before production-like deployment.

**Basis:** [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md), [ADR-018](../adr/ADR-018-production-deployment-and-iac.md)

---

# 6. Non-Functional Requirements — Initial Baseline

The following are specification requirements; exact SLOs, capacity targets, and retention values are deliberately deferred until the relevant architecture sections are defined.

- **NFR-SEC-001:** Security MUST use defense-in-depth controls. **Basis:** ADR-011.
- **NFR-SEC-002:** Model output, retrieved content, and tool proposals MUST be treated as untrusted until governed. **Basis:** ADR-011.
- **NFR-SEC-003:** Secrets MUST NOT be placed into model context as a general credential-delivery mechanism. **Basis:** ADR-011.
- **NFR-TRC-001:** Material runtime decisions MUST be attributable to artifact and policy versions. **Basis:** ADR-003, ADR-010, ADR-013.
- **NFR-TRC-002:** Historical executions MUST remain interpretable after later versions are released. **Basis:** ADR-003, ADR-013.
- **NFR-REL-001:** Runtime services MUST fail in controlled and observable ways when critical dependencies are unavailable. **Basis:** ADR-018.
- **NFR-REL-002:** Health/readiness behavior MUST distinguish dependency failure from service readiness. **Basis:** ADR-018.
- **NFR-PERF-001:** Platform overhead from governance, routing, policy, and observability SHOULD be measurable separately from provider latency.
- **NFR-SCALE-001:** Logical service boundaries MUST permit future independent scaling. **Basis:** ADR-004.
- **NFR-MAINT-001:** Service/module contracts MUST be explicit. **Basis:** ADR-004.
- **NFR-MAINT-002:** Domain ownership MUST prevent direct cross-service database ownership violations. **Basis:** ADR-004, ADR-006.
- **NFR-MAINT-003:** Node.js/TypeScript and Python components MUST communicate through defined contracts rather than language-specific internal coupling. **Basis:** ADR-005.
- **NFR-AUD-001:** Material authorization, policy, routing, evaluation, tool, and deployment decisions MUST be auditable. **Basis:** ADR-010, ADR-012, ADR-013, ADR-017, ADR-018.

---

# 7. v1 Scope Boundary — Initial Proposal

This section defines the current scope proposal; it will be refined as Stage 3B architecture decisions are made.

### v1 capability areas

1. Governed API/Edge entry.
2. Identity, RBAC, and policy enforcement.
3. Versioned Agent registry.
4. LLM Gateway and provider adapters.
5. Policy-constrained Model Router.
6. Agent Runtime.
7. PostgreSQL + pgvector RAG Runtime.
8. Governed Tool/MCP Runtime.
9. Versioned policy lifecycle.
10. Evaluation workflow and release gates.
11. Causal observability.
12. Cost attribution and FinOps baseline.
13. Governed internal Marketplace.
14. Copilot Studio integration boundary.
15. TypeScript/Python allocation with secure service communication.
16. CI/CD dependency and release gates.
17. Terraform/IaC.
18. Production-like deployment.

These capabilities are derived from the accepted ADR set; their concrete implementation boundaries are specified in later Stage 3B sections.

### Coherent end-to-end demonstration

The v1 should demonstrate the capabilities through at least one integrated workflow rather than disconnected demos. The exact runtime sequence will be specified in the runtime architecture section.

### Deferred scope

The first implementation slice should defer, unless required to prove the architecture:

- broad multi-tenant enterprise scale
- large Agent catalogs
- advanced autonomous remediation
- a full enterprise identity-provider matrix
- a large provider portfolio
- complex cross-region deployment
- full enterprise disaster-recovery topology
- advanced business-value causal inference
- a large marketplace ecosystem

These are scope boundaries, not changes to the accepted architectural decisions.

---

# 8. Enterprise Architecture

This section defines the **v1 concrete system decomposition**. It does not replace the plane and runtime decisions in the ADRs; it assigns implementable responsibilities to those architectural areas.

## 8.1 Logical architecture

```text
                         External Users / Systems
                                  |
                         [ API / Edge Boundary ]
                                  |
                         [ Identity / Context ]
                                  |
                    +-------------+-------------+
                    |                           |
              CONTROL PLANE              EXECUTION PLANE
                    |                           |
        +-----------+-----------+       +-------+--------+
        |           |           |       |       |        |
     Registry    Policy      Eval/     Agent   LLM      RAG
     /Version    /Governance  Release  Runtime Gateway Runtime
        |           |           |       |       |        |
        |           +-----------+-------+-------+--------+
        |                       |       |
        |                    Tool/MCP  Approval /
        |                    Runtime   Authorization
        |                       |       |
        +-----------------------+-------+----------------+
                                |
                        SHARED CAPABILITIES
                                |
             +------------------+-------------------+
             |          |          |        |       |
          Identity   Audit      Causal   FinOps   Artifact
          /RBAC      /Evidence  Trace    /Value   Graph
                                |
                         PostgreSQL + pgvector
```

The diagram is a logical architecture. v1 deployment units MAY combine multiple logical components where doing so does not violate domain ownership, security, or independent scaling requirements.

## 8.2 Request path

A governed execution follows this logical sequence:

```text
Ingress
  -> authenticate caller
  -> establish request / tenant / actor context
  -> resolve requested capability
  -> authorize request
  -> resolve immutable artifact versions
  -> create causal execution context
  -> execute Agent workflow
       -> LLM Gateway / Model Router
       -> RAG Runtime
       -> Tool/MCP Runtime
       -> action-level authorization where required
  -> validate / finalize response
  -> persist execution evidence
  -> expose response
```

The exact runtime state machine is deferred to the runtime architecture section; this section establishes only the system-level responsibility flow.

## 8.3 Control Plane responsibilities

The v1 Control Plane owns lifecycle and governance operations including:

- artifact registration and version metadata;
- Agent and capability registry operations;
- policy lifecycle and policy version references;
- evaluation configuration and release decisions;
- dependency graph construction and impact analysis;
- Marketplace publication/discovery metadata;
- model/provider configuration metadata;
- administrative and audit-oriented views.

Control Plane operations MUST NOT become an alternate execution path around the Execution Plane.

**Basis:** [ADR-002](../adr/ADR-002-control-execution-planes.md), [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md), [ADR-004](../adr/ADR-004-modular-microservice-ready-architecture.md)

## 8.4 Execution Plane responsibilities

The v1 Execution Plane owns live governed execution:

- Agent workflow execution;
- LLM requests through the Gateway;
- governed retrieval;
- governed Tool/MCP invocation;
- action-level authorization and policy checks;
- runtime execution state;
- response validation/finalization.

The Execution Plane MUST consume authoritative lifecycle/configuration state rather than creating independent copies of policies, artifacts, or provider configuration.

**Basis:** [ADR-002](../adr/ADR-002-control-execution-planes.md), [ADR-007](../adr/ADR-007-llm-gateway-model-routing.md), [ADR-008](../adr/ADR-008-agent-runtime.md)

## 8.5 Shared capabilities

Shared capabilities provide cross-cutting infrastructure used by both planes:

| Capability | v1 responsibility |
|---|---|
| Identity/context | Authentication context and service identity propagation |
| RBAC/authorization | Authorization decision interface |
| Policy | Effective policy resolution/evaluation |
| Version registry | Immutable artifact/version lookup |
| Dependency graph | Dependency and impact queries |
| Causal observability | Trace/event correlation |
| Audit evidence | Durable governance/security evidence |
| FinOps | Usage/cost attribution |
| PostgreSQL/pgvector | Platform persistence and vector retrieval |

Shared capabilities MUST expose contracts rather than allowing arbitrary direct access to their internal implementation.

---

# 9. Logical Service and Module Boundaries

The v1 uses logical service boundaries while permitting a smaller number of deployment units. A logical boundary is defined by responsibility, owned data, API contract, security boundary, and future scaling/extraction need.

## 9.1 Logical components

| Component | Primary responsibility | Plane | v1 runtime |
|---|---|---|---|
| API / Edge | External ingress and integration boundary | Shared/Edge | TypeScript |
| Identity / Authorization | Caller/service identity context and authorization interface | Shared | TypeScript |
| Artifact Registry | Versioned AI artifact metadata | Control | TypeScript |
| Dependency Graph | Derived dependency graph and impact analysis | Control | TypeScript |
| Policy Registry / Evaluator | Versioned policies and effective policy decisions | Control/Shared | TypeScript |
| Agent Registry | Agent metadata, versions, lifecycle state | Control | TypeScript |
| Evaluation Service | Evaluation orchestration and release signals | Control | Python |
| Marketplace | Discovery and governed publication metadata | Control | TypeScript |
| LLM Gateway | Single governed LLM access boundary | Execution/Shared | TypeScript |
| Model Router | Constraint filtering and model selection | Execution/Shared | TypeScript |
| Agent Runtime | Agent workflow state/orchestration | Execution | TypeScript |
| RAG Runtime | Ingestion/retrieval orchestration | Execution/Worker | TypeScript + Python workers |
| Tool/MCP Runtime | Tool registration, authorization handoff and execution | Execution | TypeScript |
| Observability | Causal traces/events and query surface | Shared | TypeScript integration + telemetry stack |
| FinOps / Value | Usage, pricing, cost and value records | Shared/Control | TypeScript |
| Audit | Governance/security evidence access | Shared/Control | TypeScript |

The table is a logical ownership model, not a mandate for one process/container per row.

## 9.2 Deployment-unit rule

For v1, the default deployment grouping SHOULD be:

```text
1. control-plane-api
2. execution-runtime
3. python-workers
4. web-ui
5. PostgreSQL + pgvector
6. observability infrastructure
```

A component MAY be split into an independent service when it has a concrete requirement for independent scaling, isolation, deployment cadence, security boundary, or operational ownership.

The initial grouping MUST NOT create direct database ownership violations between logical components.

## 9.3 Contract boundary rules

- A component MUST expose an explicit interface for capabilities used outside its ownership boundary.
- Components MUST NOT directly mutate another component's owned data tables as an integration mechanism.
- Cross-language communication MUST use language-neutral contracts.
- Cross-plane calls MUST preserve identity, authorization context, artifact versions, and causal correlation where applicable.
- Internal implementation details MUST NOT become public integration contracts accidentally.

**Basis:** [ADR-004](../adr/ADR-004-modular-microservice-ready-architecture.md), [ADR-005](../adr/ADR-005-polyglot-runtime-typescript-python.md), [ADR-018](../adr/ADR-018-production-deployment-and-iac.md)

---

# 10. Control Plane / Execution Plane / Shared Capability Interfaces

## 10.1 Control-to-execution contract

The Control Plane exposes authoritative version/configuration information to the Execution Plane through read-oriented contracts. The Execution Plane does not write lifecycle state directly as a substitute for Control Plane workflows.

Minimum contract concepts:

```text
ArtifactRef
  artifactType
  artifactId
  version

PolicyRef
  policyId
  version

ExecutionContext
  executionId
  actor
  serviceIdentity
  authorizationContext
  artifactSet
  policySet
  correlationId
```

These are specification concepts; concrete API schemas will be defined in the relevant runtime/data sections.

## 10.2 Execution-to-shared-capability contract

Execution components MUST use shared contracts for:

- authorization decisions;
- policy resolution;
- artifact/version lookup;
- causal event emission;
- usage/cost reporting;
- audit evidence emission.

A runtime component MUST NOT implement a private authorization mechanism that can contradict the authoritative platform authorization path.

## 10.3 Failure behavior

A shared dependency failure MUST produce a defined failure mode rather than an implicit bypass.

Examples:

| Failure | Required behavior |
|---|---|
| Authorization unavailable | Fail closed for protected action |
| Policy resolution unavailable | Do not execute protected action |
| Artifact version unavailable | Do not silently substitute another version |
| LLM provider unavailable | Gateway returns governed provider failure/fallback outcome |
| RAG unavailable | Follow capability-specific fail/deny behavior; never bypass data authorization |
| Tool authorization unavailable | Do not execute tool action |
| Observability sink degraded | Preserve minimum required evidence locally/through durable fallback where defined; do not disable governance |

Exact fallback and retry policies will be defined in the relevant service sections.

---

# 11. Artifact and Dependency Model

This section defines the v1 specification model for how versioned artifacts participate in dependency management. ADR-003 remains authoritative for the architectural decision.

## 11.1 Artifact identity

Every material artifact MUST be addressable as:

```text
ArtifactRef = (artifactType, artifactId, version)
```

The logical artifact identity is stable across versions. A version is immutable after publication.

Initial artifact types include:

- Agent
- Prompt / instruction asset
- Policy
- Tool / MCP capability
- Knowledge source / document version
- Evaluation configuration
- Evaluation dataset version
- Model/provider configuration
- Deployment artifact

The v1 registry MAY introduce additional artifact types without changing the core identity model.

## 11.2 Dependency edge

A dependency edge MUST capture at minimum:

```text
sourceArtifact
sourceVersion
edgeType
 targetArtifact
targetVersion / versionConstraint
origin
createdAt
```

`origin` distinguishes automatically observed/derived dependency evidence from explicitly declared dependency metadata.

## 11.3 Dependency graph requirements

- The graph MUST be derived from artifact metadata and/or observable integration evidence.
- A graph update MUST be attributable to the source evidence that produced it.
- Dependency changes MUST support transitive impact queries.
- A release MUST be able to determine whether changed dependencies affect its execution set.
- The graph MUST support version-specific relationships; a dependency on `Agent A v3` is not equivalent to a dependency on `Agent A v4`.

## 11.4 Reproducible execution set

A production execution MUST resolve an immutable execution set sufficient to identify the material versions used, including where applicable:

```text
Agent version
Prompt/instruction version
Policy version(s)
Model/provider configuration version
RAG knowledge/document/chunk versions
Embedding configuration/version
Tool/MCP version
Evaluation/release reference
Deployment version
```

Not every execution will use every artifact type; the recorded execution set MUST contain the applicable subset.

## 11.5 Release impact analysis

A dependency change SHOULD produce:

```text
Changed artifact
   ↓
Direct dependents
   ↓
Transitive dependents
   ↓
Affected environments / releases
   ↓
Required evaluation / approval gates
```

The implementation MUST distinguish informational impact from blocking impact. Blocking rules are release-policy configuration, not hard-coded graph semantics.

**Basis:** [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md), [ADR-012](../adr/ADR-012-ai-evaluation.md)

---

# 12. Node.js / Python Allocation

The v1 language allocation follows the accepted polyglot strategy while making the boundary concrete.

## 12.1 TypeScript / Node.js

TypeScript/Node.js owns the request-oriented platform path:

- API / Edge
- Control Plane APIs
- registries
- policy APIs/evaluation orchestration
- LLM Gateway
- Model Router
- Agent Runtime
- Tool/MCP Runtime
- Marketplace
- FinOps APIs
- audit/query APIs
- runtime integration/orchestration

## 12.2 Python

Python owns computation-heavy or ML-oriented worker responsibilities:

- evaluation workers
- embedding/document processing workers
- offline evaluation jobs
- future ML-specific analysis workers where justified

Python workers MUST NOT expose an alternate uncontrolled LLM access path. When they require governed AI capabilities, they use the same platform contract as other callers.

## 12.3 Language-neutral communication

Node.js and Python components MUST communicate through versioned, language-neutral contracts. v1 SHOULD use HTTP/JSON for synchronous control/runtime APIs and a durable job/event mechanism for asynchronous worker workloads.

The exact messaging technology is deferred until the deployment and workload requirements are specified; introducing a broker is not assumed solely because Python workers exist.

**Basis:** [ADR-005](../adr/ADR-005-polyglot-runtime-typescript-python.md)

---

# 13. Stage 3B.2 Acceptance Criteria

Stage 3B.2 is complete when:

- **AC-ARCH-001:** Every v1 capability has an identifiable logical owner and plane assignment.
- **AC-ARCH-002:** Control Plane and Execution Plane responsibilities are distinguishable without duplicating ADR rationale.
- **AC-ARCH-003:** v1 logical service/module boundaries identify responsibility, runtime language, and ownership.
- **AC-ARCH-004:** v1 deployment grouping is defined without requiring one deployment unit per logical component.
- **AC-ARCH-005:** Cross-component contract rules prevent direct cross-domain database mutation.
- **AC-ARCH-006:** Material artifact identity and dependency edges are version-aware.
- **AC-ARCH-007:** The execution set is sufficient to reconstruct the material versions used by an execution.
- **AC-ARCH-008:** Node.js/Python responsibilities and communication boundaries are explicit.
- **AC-ARCH-009:** Failure of authorization or policy services cannot silently result in protected execution.
- **AC-ARCH-010:** Each section identifies its authoritative ADR basis without copying the ADR decision text.

---

# 14. Traceability Model

The specification will maintain explicit traceability from requirements to architectural decisions and, as implementation is defined, to components and acceptance tests.

```text
Requirement
    ↓
ADR reference
    ↓
Specification component / contract
    ↓
Acceptance criterion
    ↓
Implementation test
```

Example:

```text
FR-LLM-001
  ↓
ADR-007
  ↓
LLM Gateway contract
  ↓
Gateway integration acceptance test
  ↓
CI test
```

The traceability matrix will be expanded as Stage 3B sections become concrete.

---

# 15. Change Management Rule

When an accepted ADR changes:

1. Identify affected requirements.
2. Identify affected interfaces/contracts.
3. Identify affected components and acceptance criteria.
4. Update this specification only where the change affects v1 requirements or concrete architecture.
5. Preserve the ADR as the architectural authority.
6. Record the resulting impact through the normal Git/PR review process.

This prevents architectural decisions from being duplicated across documents while still making the specification responsive to accepted architectural change.

---

## Current Stage

**Stage 3B.2 — Enterprise Architecture, Plane Boundaries, Logical Service/Module Boundaries, Artifact/Dependency Model, and Node.js/Python Allocation**

Next review target: **Stage 3B.3 — PostgreSQL + pgvector Data Architecture, LLM Gateway + Model Router Contracts, and Runtime Contracts/State Models.**
