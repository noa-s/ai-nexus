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

The current repository is documentation/governance-first. The `staging` tree contains `.gitignore`, `AGENTS.md`, `LICENSE`, a minimal `README.md`, the accepted ADR set and index, the v1 architecture specification, agent-governance guidance, and the implementation planning artifacts. No application source tree, Node.js workspace, Python project, database migrations, Docker Compose/runtime definition, Terraform implementation, or GitHub Actions CI workflow is present in the inspected `staging` tree.

Therefore Step 01 is a genuine repository foundation step, not an incremental modification to an existing application scaffold.

## 3. Repository governance constraints

`AGENTS.md` establishes that accepted ADRs are architectural authority, relevant ADRs must be read before architectural changes, conflicts must be surfaced rather than silently resolved, secrets must not be committed, applicable validation must be run, and changes should remain narrowly scoped.

The implementation plan follows these rules. The discovery also confirms that implementation step documents must not become a copied substitute for the ADRs.

## 4. ADR-derived implementation constraints

- **ADR-001:** AI Nexus is an enterprise platform, not a business-system system of record. Business systems remain external and are accessed through governed integrations.
- **ADR-002:** Control Plane, Execution Plane, and shared capabilities are explicit boundaries. Execution retains runtime authorization/policy enforcement; shared capabilities have authoritative interfaces.
- **ADR-003:** Versioned artifacts and automatically derived dependencies are required. Initial agent artifacts use `<agent-name>.artifact.ts`; PR/CI is the authoritative minimum enforcement boundary. Step 04 implements the analyzer; Step 01 provides the structure/CI extension point.
- **ADR-004:** Logical service boundaries and deployment units are separate. Domain ownership is explicit even with shared PostgreSQL. Cross-domain access uses explicit contracts or approved events/messages.
- **ADR-005:** Node.js/TypeScript and Python are first-class runtimes. They remain independently buildable; cross-runtime contracts are language-neutral; independently deployable runtimes normally use separate containers and authenticated service-to-service communication.
- **ADR-006:** PostgreSQL is the primary relational store and pgvector supports vector retrieval. Migrations and logical domain ownership must be established without treating pgvector as the source of truth for enterprise documents.
- **ADR-007:** The future LLM Gateway is the single governed LLM path. Model routing uses the authoritative Model Registry rather than a duplicate model catalog. Step 01 must not introduce an alternate provider path.
- **ADR-008:** Agent Runtime is an orchestration boundary separate from LLM, RAG, and Tool/MCP runtimes. Its eight-stage lifecycle and downstream independent policy enforcement must remain possible through the initial module boundaries.
- **ADR-009:** RAG is a governed runtime with explicit document/chunk/embedding/ingestion lineage and connector-specific source-change detection. These are later RAG responsibilities; Step 01 only establishes foundations.
- **ADR-010:** Policies are immutable, versioned governance artifacts with shared authoritative origin and distributed enforcement. Step 01 must not hide policy semantics inside arbitrary application configuration.
- **ADR-011:** Security is defense in depth; human and workload identities are distinct; secrets remain outside model context; service-to-service security and future security gates require repository/CI extension points.
- **ADR-012:** Evaluation uses versioned suites/datasets/runs/results and supports deterministic, reference-based, evaluator, and human evaluation. Step 01 establishes Python/CI foundations only.
- **ADR-013:** Causal observability requires root traces, spans, events, decisions, correlation, and protected evidence handling across service boundaries. The API/Edge is an entry boundary, not a separate business service.
- **ADR-014:** FinOps consumes authoritative LLM usage telemetry and supports hierarchical attribution, versioned pricing, budgets, anomalies, optimization, and business-value evidence. Step 01 must not create a parallel cost model.
- **ADR-015:** Marketplace is a governed discovery surface, including conversational discovery and Agent Cards, not a second execution runtime.
- **ADR-016:** v1 targets Copilot Studio via an authenticated custom connector to the external AI Nexus API/Edge boundary. Microsoft authentication does not replace AI Nexus authorization; internal runtime endpoints remain private.
- **ADR-017:** RBAC is the baseline with policy constraints. Auditor is least-privilege and Auditor access is itself auditable. Auditor Agent is a read-oriented analysis actor, not a remediation authority.
- **ADR-018:** Deployment is containerized and production-like, with GitHub Actions, Terraform where appropriate, environment separation, secure secrets, health/readiness, rollback/version identity, and service boundaries that can later be independently deployed.

## 5. Specification-to-repository gap

The v0.7 specification expects an executable platform foundation, but the current repository has none of the implementation artifacts required to execute it. The gap is foundational rather than feature-specific.

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
- Step 01 status is `READY` in the implementation roadmap and step document;
- the implementation branch for Step 01 is created from the merged `staging` baseline;
- relevant ADRs are re-read from the current branch at the start of Step 01 implementation.

## 8. Discovery conclusion

The implementation plan can now move from planning/discovery into controlled execution. No application capability should be implemented outside the Step 01 contract until Step 01 reaches `COMPLETE` under the roadmap's Definition of Done.
