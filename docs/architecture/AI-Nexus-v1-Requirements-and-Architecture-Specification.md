# AI Nexus v1 — Requirements & Architecture Specification

- **Status:** Draft — Stage 3B.4
- **Version:** 0.4
- **Date:** 2026-10-02
- **Architectural baseline:** Accepted ADR-001 through ADR-018

## 1. Purpose and Authority

This is the single authoritative v1 requirements and architecture specification. It translates accepted ADR decisions into concrete requirements, interfaces, boundaries, data contracts, acceptance criteria, and delivery constraints.

The ADRs remain the source of truth for architectural decisions. This document MUST NOT duplicate ADR rationale or become a competing architectural authority. If an ADR changes, this specification MUST be reviewed for affected requirements, contracts, constraints, and acceptance criteria.

Authoritative ADRs:

- [ADR-001](../adr/ADR-001-enterprise-ai-platform-scope.md)
- [ADR-002](../adr/ADR-002-control-execution-planes.md)
- [ADR-003](../adr/ADR-003-immutable-versioned-artifacts.md)
- [ADR-004](../adr/ADR-004-modular-microservice-ready-architecture.md)
- [ADR-005](../adr/ADR-005-polyglot-runtime-typescript-python.md)
- [ADR-006](../adr/ADR-006-postgresql-pgvector.md)
- [ADR-007](../adr/ADR-007-llm-gateway-model-routing.md)
- [ADR-008](../adr/ADR-008-agent-runtime.md)
- [ADR-009](../adr/ADR-009-rag-and-knowledge-versioning.md)
- [ADR-010](../adr/ADR-010-immutable-versioned-policies.md)
- [ADR-011](../adr/ADR-011-ai-security-architecture.md)
- [ADR-012](../adr/ADR-012-ai-evaluation.md)
- [ADR-013](../adr/ADR-013-observability-and-causal-tracing.md)
- [ADR-014](../adr/ADR-014-ai-finops-and-business-value.md)
- [ADR-015](../adr/ADR-015-ai-marketplace.md)
- [ADR-016](../adr/ADR-016-microsoft-ecosystem-integration.md)
- [ADR-017](../adr/ADR-017-rbac-and-auditor-role.md)
- [ADR-018](../adr/ADR-018-production-deployment-and-iac.md)

### Working method

```text
inspect → compare with ADRs → identify gaps/ambiguities → discuss/decide
→ update specification → commit → proceed
```

Normative language: **MUST** = required for v1; **SHOULD** = expected unless explicitly justified; **MAY** = optional; **FUTURE** = outside v1.

---

# 2. System Goals

| ID | Goal | Basis |
|---|---|---|
| G-001 | Provide a governed enterprise AI execution path. | ADR-001, 002, 010, 011, 017 |
| G-002 | Provide reusable AI platform capabilities. | ADR-001, 004 |
| G-003 | Make material AI systems versioned, traceable, and reproducible. | ADR-003, 009, 010, 012, 013 |
| G-004 | Centralize security, governance, evaluation, observability, and FinOps capabilities. | ADR-011–014 |
| G-005 | Decouple applications from individual LLM providers. | ADR-007 |
| G-006 | Provide governed enterprise AI discovery and Microsoft integration. | ADR-015, 016 |
| G-007 | Demonstrate production-oriented engineering and IaC. | ADR-018 |

# 3. System Non-Goals

- NG-001: Implement every enterprise AI use case in v1.
- NG-002: Deploy every logical capability as an independent microservice immediately.
- NG-003: Replace Microsoft tenant/organizational governance.
- NG-004: Allow an Agent or LLM to make authorization decisions.
- NG-005: Build a public commercial marketplace in v1.
- NG-006: Treat embeddings as authoritative source data.
- NG-007: Introduce operational complexity without a concrete requirement.

# 4. Personas and Primary Use Cases

Personas include executives, business leaders/users, developers, AI/ML engineers, data scientists, platform engineers, security/governance, auditors, service identities, and external integrations.

Primary use cases include governed Agent invocation; Agent registration/versioning/evaluation; governed RAG; governed Tool/MCP execution; LLM routing; evaluation/release decisions; causal investigation; FinOps/value analysis; Marketplace discovery; and Copilot Studio invocation.

# 5. Functional Requirements

## 5.1 Identity and authorization

- **FR-IAM-001:** Protected operations MUST authenticate callers.
- **FR-IAM-002:** Authorization MUST use the RBAC baseline from ADR-017.
- **FR-IAM-003:** Applicable immutable policy versions MUST participate in authorization decisions.
- **FR-IAM-004:** Authorization MUST be enforceable at action boundaries, not only ingress.
- **FR-IAM-005:** Auditor access MUST remain scoped and read-oriented.

## 5.2 Artifacts and dependencies

- **FR-ART-001:** Material AI artifacts MUST have immutable versions.
- **FR-ART-002:** Material dependencies MUST be represented in a version-aware dependency graph.
- **FR-ART-003:** Dependency evidence MUST be attributable to declared or observed source metadata.
- **FR-ART-004:** The platform MUST support transitive impact analysis.
- **FR-ART-005:** Runtime records MUST retain material artifact versions.

## 5.3 Agents and runtime

- **FR-AGT-001:** The platform MUST provide an Agent registry.
- **FR-AGT-002:** Agents MUST be versioned artifacts.
- **FR-AGT-003:** Only governed Agents may enter the governed runtime/Marketplace path.
- **FR-EXEC-001:** Agent execution MUST remain separated from LLM, RAG, and Tool/MCP responsibilities.
- **FR-EXEC-002:** LLM-generated actions MUST be proposals, never authorization decisions.
- **FR-EXEC-003:** Identity, policy context, artifact set, and causal correlation MUST propagate through execution.

## 5.4 LLM

- **FR-LLM-001:** Runtime LLM access MUST pass through the LLM Gateway.
- **FR-LLM-002:** Provider-specific behavior MUST be isolated behind provider adapters.
- **FR-LLM-003:** Routing MUST apply hard constraints before optimization.
- **FR-LLM-004:** Usage metadata MUST be available for observability and FinOps where supported.

## 5.5 RAG and tools

- **FR-RAG-001:** Knowledge MUST preserve source/document/chunk lineage.
- **FR-RAG-002:** Embeddings MUST retain their source and embedding configuration/version relationship.
- **FR-RAG-003:** Retrieval MUST enforce applicable authorization/data-access controls.
- **FR-RAG-004:** Retrieval responses MUST provide provenance sufficient to identify source versions.
- **FR-TOOL-001:** Tools/MCP capabilities MUST have governed registration and identity.
- **FR-TOOL-002:** Tool proposals MUST pass authorization/policy evaluation before execution.
- **FR-TOOL-003:** Tool credentials MUST remain outside model context.
- **FR-TOOL-004:** Tool execution MUST be represented in the causal execution record.

## 5.6 Evaluation, observability, FinOps, Marketplace, Microsoft

- **FR-EVAL-001:** Evaluation configurations and material inputs MUST be version-aware.
- **FR-EVAL-002:** Evaluation MUST support pre-production and production use.
- **FR-OBS-001:** Each AI execution MUST have a causal trace containing material decisions and versions.
- **FR-FIN-001:** Usage and pricing information MUST support version-aware cost attribution.
- **FR-FIN-002:** Platform cost, workflow cost, and business-value evidence MUST remain distinguishable.
- **FR-MKT-001:** Marketplace discovery MUST be governed and MUST NOT itself grant access.
- **FR-MS-001:** Copilot Studio MUST enter through the defined external API/Edge boundary.
- **FR-MS-002:** Microsoft authentication MUST NOT substitute for AI Nexus authorization.

## 5.7 Delivery

- **FR-DEP-001:** v1 MUST support environment separation.
- **FR-DEP-002:** Deployment artifacts MUST be immutable/versioned.
- **FR-DEP-003:** Infrastructure MUST be reproducible through Terraform/IaC.
- **FR-DEP-004:** CI/CD MUST enforce defined dependency, security, evaluation, and release gates.

## 5.8 Governance, security, evaluation, observability and FinOps

- **FR-GOV-001:** Authorization decisions MUST identify the effective policy and policy version used.
- **FR-GOV-002:** Policy conflicts MUST resolve deterministically according to an explicit evaluation order.
- **FR-GOV-003:** Denials and material policy decisions MUST be observable and auditable.
- **FR-SEC-001:** AI-specific threats MUST be represented in the security control model and release process.
- **FR-SEC-002:** Security controls MUST cover ingress, retrieval, model interaction, tool execution, secrets, data egress and supply chain boundaries.
- **FR-EVAL-003:** v1 evaluation MUST produce machine-readable results that can participate in release decisions.
- **FR-EVAL-004:** Evaluation results MUST identify the evaluated artifact set, dataset/configuration and evaluator version.
- **FR-OBS-002:** Causal traces MUST preserve decision and dependency relationships, not only chronological logs.
- **FR-FIN-003:** Cost records MUST be attributable to an execution/workflow and pricing configuration where usage data permits.
- **FR-FIN-004:** Business-value evidence MUST remain separately attributable from infrastructure/AI cost evidence.

# 6. Non-Functional Requirements

- **NFR-SEC-001:** Security MUST use defense-in-depth controls.
- **NFR-SEC-002:** Model output, retrieved content, external content, and tool proposals MUST be treated as untrusted until governed.
- **NFR-SEC-003:** Secrets MUST NOT be placed in model context as a credential-delivery mechanism.
- **NFR-TRACE-001:** Material runtime decisions MUST remain attributable to artifact and policy versions.
- **NFR-TRACE-002:** Historical executions MUST remain interpretable after later versions are released.
- **NFR-REL-001:** Critical governance dependency failures MUST fail in controlled, observable ways and MUST NOT silently bypass controls.
- **NFR-SCALE-001:** Logical boundaries MUST permit future independent scaling.
- **NFR-MAINT-001:** Cross-component contracts and domain ownership MUST be explicit.
- **NFR-MAINT-002:** Node.js/Python components MUST communicate through language-neutral contracts.

# 7. Enterprise Architecture

The logical architecture consists of API/Edge, Control Plane, Execution Plane, and Shared Capabilities. Logical boundaries do not require one deployment unit per component.

```text
External users/systems
        ↓
   API / Edge
        ↓
Identity + authorization
        ↓
 ┌───────────────┬──────────────────┐
 │ Control Plane │ Execution Plane  │
 │ registries    │ Agent Runtime    │
 │ policies      │ LLM Gateway      │
 │ evaluation    │ Model Router     │
 │ dependencies  │ RAG Runtime      │
 │ marketplace   │ Tool/MCP Runtime │
 └───────┬───────┴────────┬─────────┘
         └──── Shared Capabilities ────┐
              audit / trace / FinOps   │
                       PostgreSQL+pgvector
```

Control Plane owns lifecycle/configuration and MUST NOT become an alternate live execution path. Execution Plane owns live governed execution and MUST consume authoritative lifecycle/policy state. Shared capabilities expose contracts and MUST NOT permit arbitrary cross-domain mutation.

# 8. Logical Service / Module Boundaries

| Logical component | Responsibility | Runtime |
|---|---|---|
| API/Edge | external ingress/integration boundary | TypeScript |
| Artifact/Agent Registry | immutable metadata and lifecycle | TypeScript |
| Dependency Graph | derived dependency/impact analysis | TypeScript |
| Policy/Authorization | policy lifecycle and authorization interface | TypeScript |
| Evaluation | evaluation orchestration/workers | Python + TypeScript orchestration |
| Marketplace | governed discovery/publication metadata | TypeScript |
| LLM Gateway | single governed model-access boundary | TypeScript |
| Model Router | constraint filtering and model selection | TypeScript |
| Agent Runtime | workflow state/orchestration | TypeScript |
| RAG Runtime | ingestion/retrieval orchestration | TypeScript + Python workers |
| Tool/MCP Runtime | governed tool registration/execution | TypeScript |
| Observability | causal trace/event integration | TypeScript + telemetry stack |
| FinOps/Audit | usage/cost/value and evidence surfaces | TypeScript |

v1 MAY group logical components into fewer deployment units. Direct mutation of another component's owned data is prohibited as an integration mechanism.

# 9. Artifact and Dependency Model

A material artifact is addressed as `(artifactType, artifactId, version)`. Versions are immutable.

A dependency edge contains at minimum `sourceArtifact`, `sourceVersion`, `edgeType`, `targetArtifact`, `targetVersion/versionConstraint`, `origin`, and creation metadata.

Runtime MUST record the applicable immutable execution set, including where relevant Agent, prompt/instruction, policy, model/provider configuration, knowledge/document/chunk, embedding configuration, Tool/MCP, evaluation/release, and deployment versions.

Dependency analysis MUST support direct and transitive impact queries. Informational impact and blocking release policy are distinct concerns.

# 10. Data Architecture — PostgreSQL + pgvector

## 10.1 Ownership model

PostgreSQL is the primary relational platform store and pgvector is the vector retrieval capability, consistent with ADR-006. Logical domains own their data even when v1 uses one database deployment.

Initial domain groups are identity/access, artifact/version metadata, dependency graph, policies, agents, knowledge/RAG, evaluation, execution/trace references, FinOps/value, Marketplace, and audit evidence.

A component MUST access another domain through an explicit contract rather than direct writes to that domain's owned tables.

## 10.2 Knowledge lineage

```text
Source → Document Version → Chunk Version → Embedding → pgvector index
```

Embeddings are derived data. Each embedding MUST retain enough metadata to identify its source chunk, embedding model/configuration version, creation context, and applicable authorization metadata.

## 10.3 Retrieval requirements

- Vector search MUST be combined with applicable authorization/data-access filtering.
- Retrieval MUST return provenance identifiers.
- Knowledge versions MUST be immutable once published.
- Re-embedding creates derived versions and MUST NOT rewrite historical provenance.
- Retrieval MUST be reproducible enough to explain which knowledge version participated in an execution.

## 10.4 Initial entity relationships

```text
Artifact ──< ArtifactVersion
ArtifactVersion ──< DependencyEdge
AgentVersion ──< Execution
Policy ──< PolicyVersion
KnowledgeSource ──< DocumentVersion ──< ChunkVersion ──< Embedding
Execution ──< ExecutionEvent
Execution ──< LLMCall / Retrieval / ToolAction
EvaluationRun ──< EvaluationResult
PricingVersion ──< CostRecord
```

Exact table schemas, indexes, partitioning, retention, and migrations remain implementation-level specifications to be defined before coding.

**Basis:** ADR-003, ADR-006, ADR-009, ADR-013, ADR-014.

# 11. LLM Gateway + Model Router

## 11.1 Gateway contract

The Gateway is the single governed runtime boundary for LLM access.

Conceptual request:

```text
LLMRequest
- requestId
- executionId
- actor/service identity
- task/capability requirements
- input/messages reference
- model constraints
- policy context
- budget/latency constraints
- artifact/version context
```

Conceptual response:

```text
LLMResponse
- provider/model identity
- response/content reference
- usage metadata
- latency metadata
- routing decision reference
- policy/safety outcome
- trace correlation
```

The Gateway MUST NOT expose provider-specific request formats to consuming components.

## 11.2 Routing contract

```text
Request context
  ↓
Hard constraints
  ↓
Eligible models
  ↓
Quality/cost/latency/capability optimization
  ↓
Routing decision
  ↓
Provider adapter
```

Routing decisions MUST be observable and attributable to the routing inputs/configuration used. Fallbacks MUST remain within the eligible set and MUST NOT bypass policy or capability constraints.

## 11.3 Provider failure

Provider failure MUST produce a governed outcome. Retry/fallback behavior MUST be bounded and observable. A fallback MUST NOT silently change authorization, data-access, or capability constraints.

**Basis:** ADR-007, ADR-011, ADR-013, ADR-014.

# 12. Runtime Architecture

## 12.1 Agent Runtime

The Agent Runtime owns execution orchestration, state, planning/coordination, and step sequencing. It delegates LLM calls, retrieval, and tools to their governed runtimes.

Conceptual states:

```text
CREATED → AUTHORIZING → RESOLVING → RUNNING
RUNNING → WAITING_APPROVAL → RUNNING
RUNNING → COMPLETED
RUNNING → FAILED
RUNNING → CANCELLED
```

Each execution MUST have an immutable execution-context reference and causal correlation. Each material step records input/output references, artifact versions, policy context, status, timing, retry information, and child-operation references as applicable.

Retries MUST be bounded and MUST NOT duplicate non-idempotent actions without an explicit idempotency strategy.

## 12.2 RAG Runtime

Ingestion:

```text
source → document version → chunk versions → embedding generation → vector index/update
```

Retrieval:

```text
request → authorization/data filters → candidate retrieval → relevance filtering → provenance → response
```

Ingestion workers MUST preserve version lineage. Retrieval MUST never bypass data authorization merely because a vector match exists.

## 12.3 Tool / MCP Runtime

Tool execution follows:

```text
Agent proposal
   ↓
Tool resolution
   ↓
Authorization + policy
   ↓
Approval if required
   ↓
Credential injection outside model context
   ↓
Tool/MCP execution
   ↓
Result validation
   ↓
Causal/audit evidence
```

Tool registration MUST define identity, version, capability metadata, input/output contract, authorization requirements, and execution ownership. The model never receives raw credentials.

**Basis:** ADR-008, ADR-009, ADR-010, ADR-011, ADR-013.

# 13. Node.js / Python Runtime Allocation

TypeScript/Node.js owns request-oriented APIs, Control Plane APIs, registries, policy interfaces, Gateway, Router, Agent Runtime, Tool/MCP Runtime, Marketplace, FinOps, audit/query surfaces, and orchestration.

Python owns evaluation workers, embedding/document processing, offline evaluation, and justified ML-oriented workers.

Python MUST NOT create an alternate uncontrolled LLM path. Cross-runtime communication MUST use language-neutral versioned contracts. HTTP/JSON is the default synchronous contract; asynchronous durable jobs/events MAY be introduced when workload requirements justify them.

**Basis:** ADR-005.

# 14. Stage 3B.3 Acceptance Criteria

- **AC-DATA-001:** Logical data ownership is defined for each v1 domain.
- **AC-DATA-002:** PostgreSQL/pgvector supports versioned knowledge lineage and provenance.
- **AC-DATA-003:** Retrieval applies authorization-aware filtering.
- **AC-DATA-004:** Historical knowledge and embedding provenance is preserved.
- **AC-LLM-001:** All runtime LLM access has one governed Gateway contract.
- **AC-LLM-002:** Provider adapters are isolated from consuming components.
- **AC-LLM-003:** Routing applies hard constraints before optimization and records its decision context.
- **AC-AGENT-001:** Agent execution has explicit states and material step records.
- **AC-AGENT-002:** Retry behavior cannot silently duplicate non-idempotent actions.
- **AC-RAG-001:** Ingestion and retrieval preserve version/provenance lineage.
- **AC-TOOL-001:** Tool execution follows proposal → authorization → approval-if-required → execution.
- **AC-POLY-001:** Node/Python boundaries use language-neutral contracts.
- **AC-TRACE-001:** Runtime operations preserve causal correlation and material version references.
- **AC-ARCH-001:** Data and runtime architecture remain sections of this single authoritative specification.
- **AC-ADR-001:** No section supersedes or duplicates accepted ADR authority.

# 15. Governance and Authorization

## 15.1 Authorization decision model

Authorization is an explicit runtime decision at protected action boundaries. The v1 contract MUST expose enough context to determine the caller, requested capability/action, target resource, relevant artifact versions, applicable policy versions, and execution correlation.

Conceptual flow:

```text
Caller identity
      ↓
Requested action + resource
      ↓
RBAC baseline
      ↓
Applicable immutable policy versions
      ↓
Context/data/tool constraints
      ↓
Deterministic authorization decision
      ↓
Allow / Deny / Require approval
```

An LLM, Agent plan, retrieved document, tool output, or user-provided content MUST NOT produce the final authorization decision.

## 15.2 Effective policy and conflicts

The runtime MUST identify the effective policy set and versions used for each material authorization decision. Policy evaluation order MUST be deterministic and documented by the implementation contract.

Where constraints conflict, the implementation MUST resolve the conflict according to an explicit precedence rule rather than relying on evaluation order that is incidental to code execution.

A policy decision MUST include at minimum:

- decision: allow, deny, or approval-required;
- subject/service identity;
- action and resource;
- effective policy/version references;
- decision reason/category;
- execution correlation;
- timestamp and evaluator version where applicable.

## 15.3 Auditor and read-only access

Auditor access MUST remain read-oriented and MUST use a dedicated identity. Auditor workflows MAY inspect evidence, traces, policies, evaluation results, dependency history, and FinOps evidence, but MUST NOT gain remediation authority merely through auditor status.

**Basis:** ADR-010, ADR-017.

# 16. Security Architecture and Threat Model

The v1 threat model treats AI-specific behavior as an extension of conventional enterprise security rather than as a replacement for it.

## 16.1 Threat/control matrix

| Threat | Primary control boundary | v1 control requirement |
|---|---|---|
| Prompt injection | model input boundary | untrusted-input handling; policy-constrained execution |
| Indirect prompt injection | RAG/content boundary | content treated as untrusted; retrieval does not grant authority |
| Data exfiltration | authorization/egress boundary | action/data authorization before release |
| Excessive agency | Agent/Tool boundary | proposal → authorization → approval → execution |
| Tool abuse | Tool/MCP boundary | registered tools, scoped identity, policy checks, audit evidence |
| Confused deputy | identity boundary | preserve caller/service identity and authorization context |
| Secret exposure | credential boundary | credentials injected only into governed tool/provider execution |
| Provider compromise/failure | Gateway boundary | provider isolation, bounded fallback, observable failures |
| Cost abuse | Gateway/FinOps boundary | budgets/limits, usage tracking and anomalous-cost visibility |
| Supply-chain risk | artifact/CI boundary | dependency analysis, immutable versions and release gates |
| Governance bypass | service boundary | no direct alternate execution or data-mutation paths |
| Evaluation bypass | release boundary | required evaluation evidence before protected release |

## 16.2 Security invariants

- No runtime component may bypass the LLM Gateway for governed LLM execution.
- No Agent or model output may authorize itself or another action.
- No tool may receive unrestricted credentials.
- No retrieval result may expand a caller's data permissions.
- No service may mutate another domain's owned data through direct database access.
- Security and governance failures MUST be observable and MUST NOT silently downgrade into uncontrolled execution.

## 16.3 Security evidence

Material security decisions and enforcement events MUST be linked to the execution correlation and relevant policy/artifact versions. Sensitive payloads MUST be minimized in telemetry and audit records.

**Basis:** ADR-011, with authorization and runtime enforcement from ADR-010, ADR-017, and ADR-008.

# 17. Evaluation and Scoring

## 17.1 Evaluation model

Evaluation is a governed artifact-driven capability. An evaluation run MUST identify:

- evaluated artifact/version set;
- evaluation configuration/version;
- dataset/test-case version;
- evaluator/metric version;
- execution/model configuration where relevant;
- timestamp/environment;
- individual results and aggregate results.

The same evaluation model supports pre-production gates and production monitoring; the execution context distinguishes the two.

## 17.2 Metric classes

v1 MUST support multiple metric classes rather than assuming one universal score:

| Class | Examples | Intended use |
|---|---|---|
| Deterministic | schema validity, exact match, policy compliance | hard gates where objective |
| Retrieval | recall/precision-style measures, provenance completeness | RAG quality |
| Safety/governance | prohibited-action rate, authorization-bypass rate | release/security gates |
| Semantic | relevance, groundedness, answer quality | model/agent quality |
| Operational | latency, failure/retry rate, tool success | reliability |
| Cost | cost per execution/task | FinOps-aware optimization |

LLM-as-judge MAY be used where semantic assessment requires it, but its evaluator/model/version MUST be recorded and it MUST NOT silently replace deterministic checks where deterministic checks are sufficient.

## 17.3 Scoring and release gates

Scores MUST retain their metric definitions and evaluator versions. Aggregate scores MUST NOT erase individual metric results.

A release gate MUST define:

```text
Evaluation configuration
      ↓
Required metrics
      ↓
Thresholds / blocking rules
      ↓
Evaluation run
      ↓
Pass / Fail / Review-required
```

A single composite score MUST NOT be treated as a universal authorization to release. Security, governance, and critical regression gates may remain independently blocking.

## 17.4 Evaluation evidence

Evaluation results MUST be queryable by artifact/version and comparable across versions when the metric definition and dataset basis are compatible. Incompatible evaluation configurations MUST be identified rather than presented as directly comparable scores.

**Basis:** ADR-012.

# 18. Causal Observability

## 18.1 Causal execution model

Observability MUST represent causal relationships between decisions and downstream actions, not merely a chronological stream of logs.

Conceptual graph:

```text
Request
 ├─ authentication / authorization
 ├─ artifact resolution
 ├─ agent resolution
 ├─ planning
 ├─ LLM call
 ├─ retrieval
 │   ├─ authorization
 │   ├─ vector search
 │   └─ provenance
 ├─ tool proposal
 ├─ tool authorization
 ├─ approval
 ├─ tool execution
 └─ response validation
```

## 18.2 Event requirements

A material event SHOULD include:

- event identifier and parent/correlation identifiers;
- execution and step identifiers;
- actor/service identity;
- event type and outcome;
- artifact/policy/model/tool/knowledge references where relevant;
- timestamps and duration where relevant;
- decision reason/category where relevant;
- links to child operations.

Sensitive content SHOULD be represented by references, hashes, classifications, or redacted summaries rather than unrestricted payload capture.

## 18.3 Causal queries

v1 observability MUST support at least these investigation questions:

1. Why was this action allowed or denied?
2. Which Agent/model/policy/knowledge/tool versions participated?
3. Which upstream decision caused this downstream action?
4. What changed between two executions?
5. What was the cost and operational outcome of this execution?

## 18.4 Retention and evidence

Trace and audit retention policies MUST distinguish operational telemetry from governance evidence. Historical evidence required for reproducibility MUST survive ordinary telemetry expiration or be retained through an appropriate durable evidence mechanism.

**Basis:** ADR-013.

# 19. AI FinOps and Business Value

## 19.1 Cost attribution

v1 cost attribution MUST distinguish at least:

```text
Provider/model usage cost
        +
Platform/runtime operational cost
        +
Workflow/application operational cost
        ↓
Total attributable AI cost
```

Where supported, usage MUST be associated with execution, agent, model/provider, environment, tenant/business unit, and relevant artifact versions.

Historical calculations MUST use the applicable pricing configuration/version rather than assuming today's pricing applies retrospectively.

## 19.2 Business value

Business-value evidence MUST remain distinct from cost evidence. A value record MAY reference:

- business outcome metric;
- baseline/comparison period;
- measured result;
- attribution confidence or methodology;
- business owner;
- related workflow/Agent/version;
- evidence timestamp.

The platform MUST NOT represent an unverified business-value estimate as a measured financial outcome.

## 19.3 FinOps decision surfaces

v1 SHOULD support analysis such as:

- cost by Agent/version;
- cost by model/provider;
- cost per execution/task;
- cost by environment or business unit;
- quality/cost comparisons across versions;
- anomalous or unexpectedly expensive executions;
- business-value evidence alongside cost without conflating the two.

## 19.4 Budget and control signals

Budget limits and cost alerts MAY be enforcement inputs where supported, but cost optimization MUST remain subordinate to security, authorization, capability, and required quality constraints.

**Basis:** ADR-014, with routing requirements from ADR-007.

# 20. Stage 3B.4 Acceptance Criteria

- **AC-GOV-001:** Every protected action produces a deterministic authorization outcome tied to identity, action/resource, and applicable policy versions.
- **AC-GOV-002:** Policy conflicts follow an explicit documented precedence/evaluation order.
- **AC-GOV-003:** Auditor access is read-oriented and does not confer remediation authority.
- **AC-SEC-001:** v1 threat/control coverage includes prompt injection, indirect injection, data exfiltration, excessive agency, tool abuse, confused deputy, secret exposure, provider failure, cost abuse, supply-chain risk, and governance bypass.
- **AC-SEC-002:** Security/governance failures cannot silently bypass controlled execution paths.
- **AC-EVAL-001:** Evaluation runs are reproducible by versioned artifact, dataset/configuration, evaluator and metric definitions.
- **AC-EVAL-002:** Release gates can independently block on critical security/governance regressions.
- **AC-EVAL-003:** Deterministic checks are preferred where sufficient; semantic judges are versioned when used.
- **AC-OBS-001:** A material execution can be reconstructed as a causal decision graph.
- **AC-OBS-002:** Investigation can identify the artifact/policy/model/knowledge/tool versions responsible for a material action.
- **AC-FIN-001:** Cost can be attributed to execution/workflow and applicable pricing configuration where usage data permits.
- **AC-FIN-002:** Business-value evidence remains distinct from cost and can identify its measurement basis.
- **AC-TRACE-002:** Governance evidence remains available beyond ordinary operational telemetry retention where required for historical interpretation.

# 21. Traceability and Change Management

Traceability follows:

```text
Requirement → ADR → Specification contract/component → Acceptance criterion → Implementation test
```

When an accepted ADR changes, affected requirements, interfaces, data contracts, runtime behavior, acceptance criteria, and implementation plans MUST be reviewed. The specification changes only where the accepted decision affects concrete v1 behavior.

## Current Stage

**Stage 3B.4 — Governance + Security + Evaluation + Causal Observability + AI FinOps/Business Value.**

No application implementation should begin until the v1 specification is sufficiently defined and reviewed.
