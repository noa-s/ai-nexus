# AI Nexus v1 — Repository & Architecture Discovery

- **Status:** Complete — Stage 4.2
- **Version:** 0.1
- **Date:** 2026-10-02
- **Baseline:** `staging`
- **Purpose:** Record the repository and architecture discovery performed before activating Step 01.

## 1. Discovery method

Stage 4 implementation planning is based on three sources, all reviewed together:

1. Accepted ADR-001 through ADR-018 in `docs/adr/`.
2. `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md` v0.7.
3. The actual repository tree and current files on `staging`.

The ADRs were read as architectural authorities rather than relying only on the specification's derived summaries.

## 2. Repository baseline

The current repository is documentation/governance-first. The `staging` tree contains:

- `.gitignore`
- `AGENTS.md`
- `LICENSE`
- a minimal `README.md`
- `docs/adr/` with ADR-001 through ADR-018 and the ADR index
- `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md`
- `docs/governance/agent-governance-decision-matrix.md`
- `docs/implementation/AI-Nexus-v1-Implementation-Plan.md`
- `docs/implementation/steps/01-repository-and-platform-foundation.md`

No application source tree, Node.js workspace, Python project, database migrations, Docker Compose/runtime definition, Terraform implementation, or GitHub Actions CI workflow is present in the inspected `staging` tree.

Therefore Step 01 is a genuine repository foundation step, not an incremental modification to an existing application scaffold.

## 3. Repository governance constraints

`AGENTS.md` establishes that accepted ADRs are architectural authority, relevant ADRs must be read before architectural changes, conflicts must be surfaced rather than silently resolved, secrets must not be committed, applicable validation must be run, and changes should remain narrowly scoped.

The implementation plan follows these rules. The discovery also confirms that the implementation step documents must not become a copied substitute for the ADRs.

## 4. ADR-derived implementation constraints

### ADR-001 — Enterprise platform scope

Step 01 must establish a platform foundation, not a standalone chatbot or business-system replacement. Business systems remain external systems of record and will be accessed through governed integrations.

### ADR-002 — Control / Execution planes

The repository foundation must leave explicit boundaries for Control Plane, Execution Plane, and shared capabilities. Execution must retain runtime authorization/policy enforcement; shared capabilities require explicit interfaces.

### ADR-003 — Immutable artifacts / dependency graph

The repository must support versioned artifact conventions and deterministic repository scanning. The initial agent artifact convention is `<agent-name>.artifact.ts`. PR/CI is the authoritative minimum enforcement boundary for dependency/version consistency. Step 01 only establishes the structure/CI extension points; Step 04 implements the analyzer.

### ADR-004 — Modular/microservice-ready architecture

Logical service boundaries and deployment units are separate. Domain ownership must be explicit even when PostgreSQL is physically shared. Cross-domain access must use explicit contracts or approved asynchronous events/messages. Shared code cannot become a bypass around domain boundaries.

### ADR-005 — TypeScript/Node.js + Python

Node.js/TypeScript and Python are first-class runtimes. They remain independently identifiable and independently buildable. Cross-runtime contracts must be language-neutral. Independently deployable Node.js and Python services normally use separate containers. Internal communication must support authentication, authorization, TLS/network controls, correlation, and schema validation.

### ADR-006 — PostgreSQL + pgvector

PostgreSQL is the primary relational platform data store and pgvector supports vector retrieval. Step 01 must establish reproducible PostgreSQL + pgvector development infrastructure and versioned migrations while preserving logical domain ownership. pgvector is derived retrieval data, not the enterprise document system of record.

### ADR-007 — LLM Gateway / Model Router

The repository must not introduce an alternate provider path. The future LLM Gateway is the single governed LLM access path. The Model Router depends on an authoritative Model Registry rather than a duplicate model catalog. Step 01 only creates foundations needed by those later components.

### ADR-008 — Agent Runtime

The Agent Runtime is an orchestration boundary and must remain separate from LLM, RAG, and Tool/MCP execution. Its future eight-stage lifecycle and downstream independent policy enforcement must be preserved by the module boundaries established now.

### ADR-009 — Governed RAG / versioning

The repository must support distinct Node.js RAG orchestration and Python document/embedding/evaluation processing where appropriate, with versioned knowledge lineage and explicit future connector boundaries. Source change detection and document/embedding/ingestion versioning belong to later RAG work, not Step 01.

### ADR-010 — Immutable versioned policies

Policy definitions are shared versioned governance artifacts, not mutable configuration hidden inside a service. Step 01 must not create a policy implementation that makes policy semantics an incidental application concern.

### ADR-011 — AI security

Security is defense in depth. Human identity and workload identity are distinct. Secrets must remain outside model context. Service-to-service security, dependency scanning, secret scanning, authorization boundaries, and future AI-specific security gates must have CI/runtime extension points.

### ADR-012 — Evaluation

Evaluation is a first-class runtime capability with versioned suites, datasets, evaluators, runs, and results. Step 01 establishes Python test/worker foundations and CI extension points; it does not implement evaluation logic.

### ADR-013 — Causal observability

The architecture requires a root trace and nested spans/events/decisions propagated across service boundaries. Step 01 must establish correlation/contract conventions without prematurely implementing the full observability platform. The API/Edge is an entry boundary, not a separate business service named Ingress Service.

### ADR-014 — FinOps / business value

FinOps consumes authoritative usage telemetry from the LLM Gateway and supports hierarchical attribution and versioned pricing. Step 01 must not create an independent cost model or provider-specific billing path.

### ADR-015 — Marketplace

The Marketplace is a governed discovery surface, including conversational discovery, Agent Cards, access workflows, evaluation/trust signals, and FinOps signals. It is not a second execution runtime. Step 01 only needs repository boundaries capable of supporting this later surface.

### ADR-016 — Microsoft / Copilot Studio

v1 targets Copilot Studio through an authenticated custom connector to the AI Nexus external integration/API boundary. Microsoft authentication does not replace AI Nexus authorization. Internal runtime endpoints must remain private. Step 01 establishes the service/API and identity foundations required later.

### ADR-017 — RBAC / Auditor

RBAC is the baseline with policy constraints. Auditor is a least-privilege role and Auditor access itself is auditable. An Auditor Agent is a possible read-oriented analysis actor. Step 01 establishes identity/configuration foundations but does not implement final authorization or Auditor behavior.

### ADR-018 — Production-like deployment / IaC

The architecture is containerized, uses GitHub Actions, Terraform where appropriate, environment separation, secure secret injection, health/readiness, rollback/version identity, and production-like deployment. Logical service boundaries may initially share deployment units. Step 01 must create a CI/container foundation that later steps can extend without architectural replacement.

## 5. Specification-to-repository gap

The v0.7 specification expects an executable platform foundation, but the current repository has none of the implementation artifacts required to execute it. The gap is therefore foundational rather than feature-specific.

| Capability | Current state on `staging` | Step 01 disposition |
|---|---|---|
| Node.js/TypeScript workspace | Missing | Establish |
| Python workspace | Missing | Establish |
| Language-neutral contracts | Missing | Establish convention |
| Logical service/module structure | Documentation only | Establish |
| PostgreSQL | Missing | Establish development foundation |
| pgvector | Missing | Enable in development foundation |
| Migrations | Missing | Establish mechanism |
| Configuration model | Missing | Establish |
| Workload/service identity foundation | Missing | Establish foundation |
| Container development support | Missing | Establish |
| GitHub Actions | Missing | Establish baseline |
| LLM Gateway | Missing | Later Step 06 |
| Policy runtime | Missing | Later Step 02 |
| Dependency Analyzer | Missing | Later Step 04 |
| Model Registry | Missing | Later Step 05 |
| Agent Runtime | Missing | Later Step 08 |
| RAG Runtime | Missing | Later Step 09 |
| Tool/MCP Runtime | Missing | Later Step 10 |
| Evaluation | Missing | Later Step 11 |
| FinOps | Missing | Later Step 12 |
| Marketplace | Missing | Later Step 13 |
| Copilot Studio | Missing | Later Step 14 |
| Terraform/production deployment | Missing | Later Step 15 |

## 6. Step 01 readiness decision

**Decision: Step 01 is READY.**

The repository has no unresolved architectural contradiction blocking the foundation. The required technologies and boundaries are established by accepted ADRs, the v0.7 specification provides the requirements baseline, and the repository is sufficiently inspected to begin the first implementation step.

Step 01 must remain limited to foundations. It must not implement higher-level platform capabilities merely because the repository starts empty.

## 7. Preconditions for activation

Before implementation begins:

- the Stage 4.2 discovery record is merged;
- Step 01 status is changed from `PLANNED` to `READY` in the implementation roadmap and step document;
- the implementation branch for Step 01 is created from the merged `staging` baseline;
- relevant ADRs are re-read from the current branch at the start of Step 01 implementation.

## 8. Discovery conclusion

The implementation plan can now move from planning/discovery into controlled execution. No application capability should be implemented outside the Step 01 contract until Step 01 reaches `COMPLETE` under the roadmap's Definition of Done.
