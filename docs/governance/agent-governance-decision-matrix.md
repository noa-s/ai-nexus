# AI Nexus — Agent Governance Decision Matrix

**Status:** Draft for review
**Purpose:** Record the governance questions that must be answered for AI agents working in AI Nexus, while distinguishing decisions already constrained by ADR-001 through ADR-018 from rules that still require explicit repository governance decisions.

## Already constrained by the architectural baseline

| Area | Existing architectural constraint | Agent implication |
|---|---|---|
| Architectural decisions | Merged ADRs define the architectural baseline | Do not silently change or bypass an ADR |
| Versioned artifacts | Important platform artifacts are immutable/versioned | Create a new version rather than mutating an existing published artifact |
| Service boundaries | Capabilities have explicit ownership and contracts | Place code according to responsibility and ownership |
| Domain data | Services own their domain data | Do not directly access another service's domain-owned tables |
| Control/Execution Plane | Control and runtime responsibilities are distinct | Do not move responsibilities across the boundary for convenience |
| TypeScript/Python | Language choice follows service responsibility and ecosystem fit | Follow the allocation defined by ADR-005 |
| Database/vector storage | PostgreSQL is primary relational storage; pgvector supports vector retrieval | Do not introduce an alternate persistence architecture without an approved decision |
| LLM Gateway | Governed LLM calls enter through the central gateway | Do not bypass the gateway with direct provider integrations |
| Model routing | Hard constraints precede optimization | Cost/latency optimization cannot override policy or capability constraints |
| Agent Runtime | Runtime owns execution state/orchestration, not every AI capability | Do not turn Agent Runtime into a monolith containing LLM/RAG/tool implementations |
| RAG | Retrieval is governed by authorization and provenance | Do not bypass the RAG boundary or authorization filtering |
| Policies | Policies are immutable/versioned governance artifacts | Do not mutate published policy versions |
| Security | Defense in depth and least privilege are required | Do not weaken security controls for convenience |
| Model/tool/external content | AI-generated and external content is untrusted | Never treat model output or retrieved/tool content as authorization |
| Evaluation | AI behavior requires versioned/reproducible evaluation | Consider evaluation and release gates for material AI changes |
| Observability | Material execution must remain causally traceable | Preserve tracing and artifact/policy provenance |
| FinOps | AI cost must be attributable/versioned | Consider cost and preserve cost attribution |
| External integrations | External clients use supported boundaries | Do not expose or depend on internal implementation endpoints as public contracts |
| RBAC/audit | Least privilege and auditability are architectural requirements | Agent identity does not grant implicit authority |
| Deployment | Infrastructure is containerized/IaC-driven with controlled environments | Treat infrastructure and deployment changes as governed changes |

## Decisions still requiring explicit governance

The following are not fully specified by ADR-001 through ADR-018 and should be decided before they are treated as mandatory repository rules:

- exact protected files and directories;
- exact files/changes requiring human approval;
- whether agents may commit directly or only through pull requests;
- branch naming and merge rules;
- whether agents may create, move, or delete files autonomously;
- exact `apps` / `libs` / `shared` conventions;
- exact React/frontend conventions;
- maximum function/file length and complexity thresholds;
- exact coverage gates and test matrix;
- mandatory lint/typecheck/build/security commands;
- dependency addition and upgrade approval rules;
- exact runtime/tool versions where not already pinned by the repository;
- scope-expansion and opportunistic-refactoring rules;
- exact escalation mechanism for architectural ambiguity;
- rules for agent-to-agent handoffs and verification;
- required documentation for particular classes of changes.

## Decision format

For each unresolved item, record:

1. **Question**
2. **Proposed default**
3. **Agent authority** — autonomous / report / approval required / prohibited
4. **Human approval requirement**
5. **Affected files/directories**
6. **Validation required**
7. **Rationale**

This matrix is intentionally a draft. It does not convert unresolved questions into mandatory repository policy until they are explicitly approved.
