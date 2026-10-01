# AI Nexus v1 — Stage 3B.3 Data and Runtime Specification

- **Status:** Draft — Stage 3B.3
- **Version:** 0.1
- **Date:** 2026-10-02
- **Parent specification:** [AI Nexus v1 — Requirements & Architecture Specification](../AI-Nexus-v1-Requirements-and-Architecture-Specification.md)
- **Architectural baseline:** Accepted ADR-001 through ADR-018

## 1. Purpose and authority

This section adds concrete v1 data and runtime requirements to the parent specification. It does not replace or duplicate architectural decisions in the ADRs.

Relevant authoritative ADRs:

- [ADR-006 — PostgreSQL + pgvector](../../adr/ADR-006-postgresql-pgvector.md)
- [ADR-007 — LLM Gateway and Model Routing](../../adr/ADR-007-llm-gateway-model-routing.md)
- [ADR-008 — Agent Runtime](../../adr/ADR-008-agent-runtime.md)
- [ADR-009 — RAG and Knowledge Versioning](../../adr/ADR-009-rag-and-knowledge-versioning.md)
- [ADR-003 — Immutable Versioned Artifacts](../../adr/ADR-003-immutable-versioned-artifacts.md)
- [ADR-010 — Immutable Versioned Policies](../../adr/ADR-010-immutable-versioned-policies.md)
- [ADR-013 — Observability and Causal Tracing](../../adr/ADR-013-observability-and-causal-tracing.md)

If an ADR changes, the parent specification and this section MUST be reviewed for impact.

---

# 2. PostgreSQL + pgvector data architecture

## 2.1 Data ownership model

PostgreSQL is the v1 physical data foundation. Logical ownership remains separated by domain.

| Domain | Owns | Does not own |
|---|---|---|
| Identity/access | identity references, role assignments, authorization references | provider/model metadata |
| Artifact | artifact identities, immutable versions, lifecycle metadata | runtime execution state |
| Dependency | derived dependency edges, impact-analysis metadata | artifact source content |
| Policy | policy identities, immutable policy versions | runtime authorization code |
| Model | provider/model registry metadata, capabilities, lifecycle metadata | provider execution state |
| Knowledge | sources, document versions, chunks, provenance, retrieval metadata | external source-of-truth documents |
| Evaluation | evaluation definitions, datasets/references, runs, results | runtime policy definitions |
| Execution | execution/workflow metadata needed for orchestration and trace correlation | domain-owned registry records |
| Usage/FinOps | usage records, pricing versions, cost attribution | provider secrets |
| Marketplace | listings, publication/access metadata | execution authorization logic |
| Audit/security | audit/security evidence references | domain transaction ownership |

A domain MAY share the same PostgreSQL cluster/schema infrastructure in v1, but application code MUST NOT directly mutate another domain's owned tables.

## 2.2 Versioned relational model

Material versioned objects MUST use stable logical identity plus immutable version identity.

Conceptually:

```text
artifact
  └── artifact_version
        ├── dependency_edge
        ├── policy_reference
        ├── evaluation_reference
        └── deployment_reference
```

The exact table names are implementation details. The required behavior is:

- logical identity remains stable across versions;
- versions are immutable after publication;
- runtime records reference concrete versions rather than only mutable logical names;
- historical records remain interpretable after newer versions exist.

## 2.3 Knowledge data model

The v1 knowledge model MUST preserve this lineage:

```text
source
  ↓
document_version
  ↓
chunk_version
  ↓
embedding
  ↓
pgvector index
```

Minimum logical relationships:

- source → document version;
- document version → chunks;
- chunk → embedding configuration/version;
- chunk → access/classification metadata;
- chunk → provenance metadata;
- retrieval result → exact chunk/document version.

A source update MUST result in a new immutable document version and derived artifacts rather than mutation of the historical representation.

## 2.4 Retrieval query requirements

A governed retrieval operation MUST be able to combine:

1. caller/request identity;
2. effective knowledge constraints;
3. semantic similarity;
4. metadata filters;
5. provenance requirements;
6. document-version state;
7. optional lexical/hybrid retrieval;
8. optional reranking.

The v1 design MUST make authorization filtering part of the retrieval contract, not a post-processing assumption applied after arbitrary chunks have already been exposed to the model.

## 2.5 Indexing requirements

The implementation specification MUST define and benchmark appropriate indexes for:

- primary relational lookups;
- foreign-key relationships;
- version lookups;
- dependency traversal;
- authorization/classification filters;
- vector similarity retrieval;
- common provenance queries.

Vector indexing strategy is an implementation choice and MUST be validated against the selected embedding dimensionality, expected corpus size, and retrieval-quality/latency targets.

---

# 3. LLM Gateway and Model Router contract

## 3.1 Gateway boundary

The LLM Gateway is the only v1 runtime boundary through which AI Nexus performs governed LLM invocation.

Consumers MUST NOT require provider-specific SDK integration in order to invoke an approved model.

## 3.2 Logical request contract

The v1 internal invocation contract SHOULD contain the following conceptual fields:

```text
LLMRequest
├── request_id
├── trace_context
├── caller_identity
├── tenant_or_org_context
├── task_context
├── messages / input
├── requested_capability
├── quality_requirement
├── latency_constraint
├── cost_constraint
├── data_classification
├── model_constraint (optional)
├── agent_context (optional)
├── tool_context (optional)
├── policy_context
└── response_requirements
```

The concrete transport and schema are implementation decisions, but the contract MUST preserve enough information for policy enforcement, routing, observability and FinOps.

## 3.3 Routing decision contract

The Model Router MUST produce a decision that is explainable to authorized operators/auditors.

Conceptually:

```text
RoutingDecision
├── selected_provider
├── selected_model
├── eligibility_result
├── excluded_candidates[]
│   └── reason_code
├── optimization_factors
├── fallback_plan (if applicable)
├── policy_reference
└── trace_reference
```

Sensitive internal policy/scoring information MUST NOT automatically be exposed to ordinary end users.

## 3.4 Provider adapter boundary

Provider adapters MUST isolate provider-specific concerns including:

- authentication/credential handling;
- request/response translation;
- provider-specific capabilities;
- usage metadata normalization;
- provider error normalization;
- timeout/retry semantics.

The Gateway owns the platform contract; adapters own provider protocol differences.

## 3.5 Routing failure semantics

The router MUST distinguish at least:

- no eligible model;
- policy rejection;
- provider unavailable;
- provider timeout;
- quota/budget exhaustion;
- malformed provider response;
- transient provider error.

Fallback MAY address transient/provider availability failures when another candidate is eligible. Fallback MUST NOT bypass a hard policy or authorization constraint.

---

# 4. Agent Runtime contract and state model

## 4.1 Runtime ownership

The Agent Runtime owns execution state and orchestration. It does not own LLM provider execution, vector retrieval implementation, tool execution, or policy lifecycle.

## 4.2 Execution state

A v1 execution SHOULD expose an explicit state machine:

```text
RECEIVED
   ↓
INITIALIZING
   ↓
AGENT_RESOLVED
   ↓
PLANNING
   ↓
EXECUTING_STEP
   ├── LLM_CALL
   ├── RAG_CALL
   ├── TOOL_PROPOSAL
   └── APPROVAL_WAIT
   ↓
VALIDATING_RESPONSE
   ↓
COMPLETED
```

Terminal/error states MUST distinguish cancellation, policy denial, dependency failure, timeout and execution failure where operationally useful.

## 4.3 Step contract

Each material execution step MUST retain, directly or through causal references:

- execution ID;
- step ID;
- parent step ID where applicable;
- artifact/policy versions relevant to the step;
- input provenance/trust state;
- action type;
- downstream capability invoked;
- authorization outcome where applicable;
- start/end timing;
- outcome/error classification.

## 4.4 Retry boundaries

Retries MUST be bounded by stage and MUST preserve the original causal relationship.

A retry MUST NOT silently become a new unrelated execution.

Non-idempotent tool actions MUST require explicit idempotency/approval handling appropriate to the action before retry.

## 4.5 Approval handling

When policy requires approval:

```text
Agent Runtime
    ↓
Tool/action proposal
    ↓
Policy + authorization
    ↓
Approval required
    ↓
WAITING_FOR_APPROVAL
    ↓
Approved / Denied / Expired
```

The approval decision MUST be represented in the execution trace and MUST be bound to the relevant action/proposal.

---

# 5. RAG Runtime contract

## 5.1 Retrieval request

A governed RAG request MUST carry sufficient context to evaluate knowledge authorization, including:

- caller identity;
- organization/tenant context where applicable;
- Agent/version context;
- applicable policy references;
- requested knowledge scope;
- query/input;
- trace context;
- retrieval constraints.

## 5.2 Retrieval response

A retrieval response MUST preserve provenance for each material result.

Conceptually:

```text
RetrievalResult
├── chunk_id
├── document_version_id
├── source_reference
├── similarity / retrieval score
├── provenance
├── classification/access metadata
└── content
```

Internal identifiers MAY be transformed before presentation to end users, but the platform trace MUST retain sufficient evidence for authorized investigation.

## 5.3 Ingestion pipeline

The v1 ingestion pipeline MUST preserve distinct versions for:

- source/document version;
- chunking/ingestion pipeline version;
- embedding model/version.

A re-embedding operation MUST NOT imply that the source document changed.

A source-document update MUST NOT be represented only as a new embedding of the old document version.

---

# 6. Tool / MCP Runtime contract

## 6.1 Tool registration

A tool capability MUST have a governed registration containing, at minimum, conceptual metadata for:

- stable tool identity;
- version;
- capability description;
- input/output contract;
- owning domain/service;
- required permissions;
- data sensitivity expectations;
- credential reference;
- availability/status;
- policy constraints.

## 6.2 Tool proposal and execution

The runtime MUST separate:

```text
model/agent proposal
        ↓
validation
        ↓
authorization + policy
        ↓
approval if required
        ↓
credential acquisition
        ↓
tool execution
        ↓
result validation
        ↓
causal trace
```

The model MUST NOT receive raw tool credentials.

## 6.3 MCP boundary

MCP is treated as a tool integration protocol/boundary, not as a replacement for AI Nexus governance.

An MCP server/tool MUST enter the governed Tool Runtime path before execution when it is used by an AI Nexus Agent.

---

# 7. Cross-runtime data and communication rules

Node.js/TypeScript and Python components MUST communicate through explicit versioned contracts.

The contract boundary MUST include, as applicable:

- request identity;
- trace context;
- artifact/version references;
- policy references;
- authorization context;
- input/output schema;
- error taxonomy;
- timeout/deadline;
- provenance metadata.

Python workers MUST NOT directly bypass the LLM Gateway, Policy/Authorization boundary, or domain ownership rules simply because they are implemented outside the primary TypeScript runtime.

For asynchronous workloads, messages MUST be versioned and MUST preserve correlation and causality information.

---

# 8. Acceptance criteria for Stage 3B.3

- **AC-DATA-001:** Each material v1 domain has an explicit logical data owner.
- **AC-DATA-002:** Historical artifact and knowledge versions remain queryable after newer versions exist.
- **AC-DATA-003:** A retrieval result can be traced to an exact document version and embedding/ingestion configuration.
- **AC-DATA-004:** Unauthorized knowledge cannot be returned solely because it is a high-similarity vector match.
- **AC-LLM-001:** A runtime LLM call can be represented through one provider-neutral Gateway contract.
- **AC-LLM-002:** A routing decision records selected model/provider and sufficient exclusion/fallback evidence for authorized investigation.
- **AC-LLM-003:** A policy-ineligible model cannot become eligible through fallback.
- **AC-AGT-001:** An Agent execution can move through explicit runtime states and retain causal step relationships.
- **AC-AGT-002:** A tool proposal cannot directly authorize its own execution.
- **AC-AGT-003:** A required approval pauses and resumes the same causal execution rather than creating an unrelated execution.
- **AC-TOOL-001:** Tool credentials are unavailable to model context.
- **AC-TOOL-002:** MCP execution passes through the governed Tool Runtime boundary.
- **AC-XRT-001:** Node.js and Python components exchange explicit contracts containing correlation/version context.
- **AC-XRT-002:** A Python component cannot bypass the governed LLM/policy/data-ownership boundaries through direct infrastructure access.

---

# 9. Open questions intentionally deferred

The following are not resolved by this section and should be decided in later Stage 3B work or implementation design:

1. Exact PostgreSQL schema/table names.
2. Exact vector index type and tuning values.
3. Exact API transport (HTTP/gRPC/event transport) per boundary.
4. Exact LLM request/response serialization.
5. Exact Agent Runtime persistence mechanism.
6. Exact asynchronous broker, if required.
7. Exact MCP server hosting topology.
8. Exact embedding model/provider selection.
9. Exact RAG reranking implementation.
10. Exact SLO, latency and capacity targets.

These questions do not reopen ADR decisions; they are implementation-level details that the remaining specification must constrain before coding begins.
