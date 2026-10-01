# AI Nexus Architecture Decision Records

This directory records the architectural decisions that establish the foundation for AI Nexus.

The ADRs are intentionally being introduced before implementation so the implementation can be reviewed against the Stage 1 gap analysis, Stage 2 Principal positioning, and Stage 3 architecture planning.

## Status convention

- **Proposed** — decision captured from the architecture planning and awaiting review/approval.
- **Accepted** — reviewed and approved for implementation.
- **Superseded** — replaced by a later ADR.

The ADRs have completed the review/approval phase and are now the accepted architectural baseline for implementation and the Stage 3B requirements/architecture specification.

The working process is:

```text
Review ADR
   ↓
Compare with Stage 1 / Stage 2 / Stage 3 decisions
   ↓
Identify missing, ambiguous, or conflicting decisions
   ↓
Update ADR
   ↓
Accept
   ↓
Commit
   ↓
Proceed to requirements and implementation planning
```

The ADR phase is deliberately documentation-first. No implementation decision should be inferred from code because the platform implementation follows these architectural decisions.

## Decision index

| ADR | Decision | Status |
|---|---|---|
| [001](./ADR-001-enterprise-ai-platform-scope.md) | Enterprise AI platform scope and boundary | Accepted |
| [002](./ADR-002-control-execution-planes.md) | Control Plane vs Execution Plane with shared capabilities | Accepted |
| [003](./ADR-003-immutable-versioned-artifacts.md) | Immutable versioned artifacts and automated dependency graph | Accepted |
| [004](./ADR-004-modular-microservice-ready-architecture.md) | Modular, microservice-ready architecture | Accepted |
| [005](./ADR-005-polyglot-runtime-typescript-python.md) | Polyglot TypeScript/Node.js and Python runtime strategy | Accepted |
| [006](./ADR-006-postgresql-pgvector.md) | PostgreSQL + pgvector as the platform data foundation | Accepted |
| [007](./ADR-007-llm-gateway-model-routing.md) | Central LLM Gateway and policy-driven model routing | Accepted |
| [008](./ADR-008-agent-runtime.md) | Explicit agent runtime separation and governed execution | Accepted |
| [009](./ADR-009-rag-and-knowledge-versioning.md) | Governed RAG, provenance, and source versioning | Accepted |
| [010](./ADR-010-immutable-versioned-policies.md) | Policies as immutable versioned governance artifacts | Accepted |
| [011](./ADR-011-ai-security-architecture.md) | AI security architecture and threat controls | Accepted |
| [012](./ADR-012-ai-evaluation.md) | Pre-production and production AI evaluation | Accepted |
| [013](./ADR-013-observability-and-causal-tracing.md) | Distributed AI observability and causal tracing | Accepted |
| [014](./ADR-014-ai-finops-and-business-value.md) | AI FinOps, cost attribution, and business value | Accepted |
| [015](./ADR-015-ai-marketplace.md) | Governed AI Marketplace and conversational discovery | Accepted |
| [016](./ADR-016-microsoft-ecosystem-integration.md) | Microsoft ecosystem integration and Copilot Studio gateway boundary | Accepted |
| [017](./ADR-017-rbac-and-auditor-role.md) | RBAC, scoped Auditor access, and Auditor Agent boundaries | Accepted |
| [018](./ADR-018-production-deployment-and-iac.md) | Production-like deployment and infrastructure as code | Accepted |

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

- Security is defense-in-depth and treats model output, retrieved content, and tool proposals as untrusted until governed.
- Evaluation is versioned and supports both pre-production release gates and production monitoring.
- Observability is causal rather than limited to request-level logs.
- FinOps attributes usage and cost while distinguishing measured, observed, and estimated business value.

### Deployment

- v1 is production-like but intentionally avoids unnecessary microservice operational complexity.
- Terraform/IaC, CI/CD, secure service communication, environment separation, health/readiness, secrets management, and immutable deployments are architectural requirements.
