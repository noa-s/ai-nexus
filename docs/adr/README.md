# AI Nexus Architecture Decision Records

This directory records the architectural decisions that establish the foundation for AI Nexus.

The ADRs are intentionally being introduced before implementation so the implementation can be reviewed against the Stage 1 gap analysis, Stage 2 Principal positioning, and Stage 3 architecture planning.

## Status convention

- **Proposed** — decision captured from the architecture planning and awaiting review.
- **Accepted** — reviewed and approved for implementation.
- **Superseded** — replaced by a later ADR.

The first ADR PR is deliberately documentation-only. No implementation decision should be inferred from code because no platform code exists yet.

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

## Traceability

These decisions are grounded in the project preparation sources:

- Stage 1 identifies enterprise AI platform architecture, LLM gateway/provider abstraction, model routing, agent lifecycle, governance, security, evaluation, observability, FinOps, PostgreSQL/pgvector, RAG, Terraform/IaC, and Azure/Microsoft ecosystem work as the relevant gap-closing areas.
- Stage 2 positions AI Nexus as an organization-wide AI platform demonstrating technical platform capabilities plus the organizational model for governed AI adoption.
- The current Ormat role emphasizes platform architecture/reliability/integration/observability, marketplace, FinOps, guardrails, evaluation, rollback, Microsoft 365/Copilot Studio/Power Platform, and enterprise-scale governance.

These ADRs do not replace the Stage 3 Requirements & Architecture Specification. They establish the durable decisions that the specification and implementation must honor.