# AI Nexus Architecture Decision Records

This directory records the architectural decisions that establish the foundation for AI Nexus.

The ADRs are intentionally being introduced before implementation so the implementation can be reviewed against the Stage 1 gap analysis, Stage 2 Principal positioning, and Stage 3 architecture planning.

## Status convention

- **Proposed** — decision captured from the architecture planning and awaiting review/approval.
- **Accepted** — reviewed and approved for implementation.
- **Superseded** — replaced by a later ADR.

The ADRs are reviewed sequentially before implementation. The working process is:

```text
Review ADR
   ↓
Compare with Stage 1 / Stage 2 / Stage 3 decisions
   ↓
Identify missing, ambiguous, or conflicting decisions
   ↓
Update ADR
   ↓
Commit
   ↓
Proceed to next ADR
```

The ADR phase is deliberately documentation-first. No implementation decision should be inferred from code because the platform implementation follows these architectural decisions.

## Decision index

| ADR | Decision | Status |
|---|---|---|
| [001](./ADR-001-enterprise-ai-platform-scope.md) | Enterprise AI platform scope and boundary | Proposed |
| [002](./ADR-002-control-execution-planes.md) | Control Plane vs Execution Plane with shared capabilities | Proposed |
| [003](./ADR-003-immutable-versioned-artifacts.md) | Immutable versioned artifacts and automated dependency graph | Proposed |
| [004](./ADR-004-modular-microservice-ready-architecture.md) | Modular, microservice-ready architecture | Proposed |
| [005](./ADR-005-polyglot-runtime-typescript-python.md) | Polyglot TypeScript/Node.js and Python runtime strategy | Proposed |
| [006](./ADR-006-postgresql-pgvector.md) | PostgreSQL + pgvector as the platform data foundation | Proposed |
| [007](./ADR-007-llm-gateway-model-routing.md) | Central LLM Gateway and policy-driven model routing | Proposed |
| [008](./ADR-008-agent-runtime.md) | Explicit agent runtime separation and governed execution | Proposed |
| [009](./ADR-009-rag-and-knowledge-versioning.md) | Governed RAG, provenance, and source versioning | Proposed |
| [010](./ADR-010-immutable-versioned-policies.md) | Policies as immutable versioned governance artifacts | Proposed |
| [011](./ADR-011-ai-security-architecture.md) | AI security architecture and threat controls | Proposed |
| [012](./ADR-012-ai-evaluation.md) | Pre-production and production AI evaluation | Proposed |
| [013](./ADR-013-observability-and-causal-tracing.md) | Distributed AI observability and causal tracing | Proposed |
| [014](./ADR-014-ai-finops-and-business-value.md) | AI FinOps, cost attribution, and business value | Proposed |
| [015](./ADR-015-ai-marketplace.md) | Governed AI Marketplace and conversational discovery | Proposed |
| [016](./ADR-016-microsoft-ecosystem-integration.md) | Microsoft ecosystem integration and Copilot Studio gateway boundary | Proposed |
| [017](./ADR-017-rbac-and-auditor-role.md) | RBAC, scoped Auditor access, and Auditor Agent boundaries | Proposed |
| [018](./ADR-018-production-deployment-and-iac.md) | Production-like deployment and infrastructure as code | Proposed |

## Cross-ADR architectural themes

The ADR set should be read as a connected architecture rather than as isolated decisions.

### Governance and authorization

- Control Plane and Execution Plane are separated while shared capabilities remain reusable by both.
- Policies are immutable, versioned governance artifacts rather than mutable runtime configuration.
- RBAC provides the baseline authorization model, with policy constraints for tenant, resource, classification, environment, and other attributes.
- Auditor is a scoped read-oriented role; an Auditor Agent uses a dedicated service identity and does not gain remediation authority merely by being an Agent.

### Versioning and traceability

- Material artifacts are versioned.
- Dependencies between versioned artifacts are represented by an automated dependency graph.
- Changes should be detected before merge/release through repository/CI validation.
- Execution traces preserve the relevant artifact and policy versions so historical decisions can be reconstructed.
- Knowledge provenance includes the applicable source/document version.

### Execution and integration

- AI Nexus has explicit runtime boundaries for Agent, RAG, Tool/MCP, and LLM/model-routing responsibilities.
- The external API/Edge boundary is the controlled entry point; external clients do not bypass internal services.
- Copilot Studio is the selected v1 Microsoft ecosystem integration, while organization-wide enforcement additionally depends on Microsoft tenant/organizational controls.
- Logical service boundaries are designed to be microservice-ready even when v1 deployment groups services together.

### Security, evaluation, observability, and FinOps

- AI security includes ordinary platform threats plus AI-specific threats such as prompt injection, tool abuse, data leakage, excessive agency, and model/provider risks.
- Tool authorization must preserve the causal chain when an Agent proposes a forbidden action.
- Evaluation covers pre-production and production behavior with measurable metrics and evidence collection.
- Observability uses distributed causal traces with spans/events/decisions for material actions within an AI request.
- FinOps measures AI cost and business value, including time/productivity outcomes, rather than treating model cost as the only economic metric.

## Traceability

These decisions are grounded in the project preparation sources:

- Stage 1 identifies enterprise AI platform architecture, LLM gateway/provider abstraction, model routing, agent lifecycle, governance, security, evaluation, observability, FinOps, PostgreSQL/pgvector, RAG, Terraform/IaC, and Azure/Microsoft ecosystem work as the relevant gap-closing areas.
- Stage 2 positions AI Nexus as an organization-wide AI platform demonstrating technical platform capabilities plus the organizational model for governed AI adoption.
- The current Ormat role emphasizes platform architecture/reliability/integration/observability, marketplace, FinOps, guardrails, evaluation, rollback, Microsoft 365/Copilot Studio/Power Platform, and enterprise-scale governance.

These ADRs do not replace the Stage 3 Requirements & Architecture Specification. They establish the durable decisions that the specification and implementation must honor.

## Next artifact

After the ADR review is complete, the next authoritative design artifact is the **AI Nexus v1 Requirements & Architecture Specification**. It will translate these decisions into concrete requirements, component boundaries, interfaces, data models, security controls, deployment topology, MVP scope, and implementation sequencing.
