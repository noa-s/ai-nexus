# AI Nexus v1 — Repository & Architecture Discovery

- **Status:** Complete — Stage 4.2
- **Version:** 0.2
- **Date:** 2026-10-02
- **Baseline:** `staging`
- **Purpose:** Record the repository and architecture discovery performed before and during controlled implementation, with Section 5 refreshed after each completed implementation stage.

## 1. Discovery method

Stage 4 implementation planning is based on three sources, all reviewed together:

1. Accepted ADR-001 through ADR-018 in `docs/adr/`.
2. `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md` v0.7.
3. The actual repository tree and current files on `staging`.

The ADRs were read as architectural authorities rather than relying only on the specification's derived summaries.

## 2. Repository baseline

The repository began as documentation/governance-first. Step 01 established the executable monorepo foundation, Node.js/TypeScript and Python foundations, language-neutral contracts, PostgreSQL + pgvector development support, configuration, service identity foundations, container support, and CI. Step 02 then added the identity, authorization, policy, Auditor, audit, and protected service-to-service foundations.

The current repository is therefore no longer an empty application scaffold. It contains a minimal executable API/Edge application, shared contracts, PostgreSQL migrations, authorization/policy modules, and dedicated tests while higher-level execution capabilities remain intentionally absent.

## 3. Repository governance constraints

`AGENTS.md` establishes that accepted ADRs are architectural authority, relevant ADRs must be read before architectural changes, conflicts must be surfaced rather than silently resolved, secrets must not be committed, applicable validation must be run, and changes should remain narrowly scoped.

The implementation plan follows these rules. The discovery also confirms that implementation step documents must not become a copied substitute for the ADRs.

## 4. ADR-derived implementation constraints

- **ADR-001:** AI Nexus is an enterprise platform, not a business-system system of record. Business systems remain external and are accessed through governed integrations.
- **ADR-002:** Control Plane, Execution Plane, and shared capabilities are explicit boundaries. Execution retains runtime authorization/policy enforcement; shared capabilities have authoritative interfaces.
- **ADR-003:** Versioned artifacts and automatically derived dependencies are required. Initial agent artifacts use `<agent-name>.artifact.ts`; PR/CI is the authoritative minimum enforcement boundary. Step 04 implements the analyzer; earlier steps provide the structure/CI extension point and Step 03 provides declared version-reference metadata.
- **ADR-004:** Logical service boundaries and deployment units are separate. Domain ownership is explicit even with shared PostgreSQL. Cross-domain access uses explicit contracts or approved events/messages.
- **ADR-005:** Node.js/TypeScript and Python are first-class runtimes. They remain independently buildable; cross-runtime contracts are language-neutral; independently deployable runtimes normally use separate containers and authenticated service-to-service communication.
- **ADR-006:** PostgreSQL is the primary relational store and pgvector supports vector retrieval. Migrations and logical domain ownership are established without treating pgvector as the source of truth for enterprise documents.
- **ADR-007:** The future LLM Gateway is the single governed LLM path. Model routing uses the authoritative Model Registry rather than a duplicate model catalog. No alternate provider path has been introduced by the completed foundation steps.
- **ADR-008:** Agent Runtime is an orchestration boundary separate from LLM, RAG, and Tool/MCP runtimes. Its eight-stage lifecycle and downstream independent policy enforcement remain later implementation responsibilities.
- **ADR-009:** RAG is a governed runtime with explicit document/chunk/embedding/ingestion lineage and connector-specific source-change detection. These are later RAG responsibilities; completed foundation steps only establish prerequisites.
- **ADR-010:** Policies are immutable, versioned governance artifacts with shared authoritative origin and distributed enforcement. Step 02 established the policy registry and immutable policy foundation. Agent policy references in Step 03 must point to those authoritative versions rather than duplicate policy definitions.
- **ADR-011:** Security is defense in depth; human and workload identities are distinct; secrets remain outside model context; service-to-service security and security gates require repository/CI extension points.
- **ADR-012:** Evaluation uses versioned suites/datasets/runs/results and supports deterministic, reference-based, evaluator, and human evaluation. Evaluation remains a later implementation capability.
- **ADR-013:** Causal observability requires root traces, spans, events, decisions, correlation, and protected evidence handling across service boundaries. Step 02 establishes authorization/audit correlation; Step 07 will establish the broader causal telemetry capability.
- **ADR-014:** FinOps consumes authoritative LLM usage telemetry and supports hierarchical attribution, versioned pricing, budgets, anomalies, optimization, and business-value evidence. No parallel cost model has been introduced.
- **ADR-015:** Marketplace is a governed discovery surface, including conversational discovery and Agent Cards, not a second execution runtime. Step 03 supplies governed Agent metadata required later by Marketplace.
- **ADR-016:** v1 targets Copilot Studio via an authenticated custom connector to the external AI Nexus API/Edge boundary. Microsoft authentication does not replace AI Nexus authorization; internal runtime endpoints remain private.
- **ADR-017:** RBAC is the baseline with policy constraints. Auditor is least-privilege and Auditor access is itself auditable. Step 02 established the Auditor boundary; registry history must remain scoped and read-oriented.
- **ADR-018:** Deployment is containerized and production-like, with GitHub Actions, Terraform where appropriate, environment separation, secure secrets, health/readiness, rollback/version identity, and service boundaries that can later be independently deployed.

## 5. Specification-to-repository gap

**Living section — refreshed after Step 02 was merged to `staging`.**

The v0.7 specification now has executable foundations for identity/authorization/policy and the repository/platform baseline. The major remaining gap is the governed artifact/Agent registry and the later execution/governance capabilities that depend on it.

| Capability | Current state on `staging` | Next disposition |
|---|---|---|
| Node.js/TypeScript workspace | Present; executable API/Edge foundation | Maintain/extend as needed |
| Python workspace | Present; foundation/CI coverage | Maintain/extend for later AI/data workers |
| Language-neutral contracts | Present under `packages/contracts/v1` | Extend per step-specific contracts |
| Logical service/module structure | API/Edge plus explicit auth/policy/audit module boundaries | Extend with registry boundaries |
| PostgreSQL | Present with development database foundation | Extend with domain migrations |
| pgvector | Present in database foundation | Consume later for RAG |
| Migrations | Present and CI-validated | Extend per domain step |
| Configuration model | Present | Maintain |
| Workload/service identity foundation | Present through Step 02 | Reuse for protected registry operations |
| Container development support | Present | Maintain |
| GitHub Actions | Present; Node/Python/database/repository safety checks | Extend with step-specific gates |
| Identity / authorization / policy | Step 02 implemented and merged | Reuse; do not duplicate |
| Auditor / protected audit evidence | Step 02 foundation implemented and merged | Reuse; extend only through later evidence requirements |
| Artifact Registry | Missing | **Step 03 — establish** |
| Agent Registry / AgentVersion | Missing | **Step 03 — establish** |
| Exact versioned policy references from AgentVersion | Policy Registry exists; AgentVersion references missing | **Step 03 — establish** |
| Declared artifact dependency-reference contract | Missing | **Step 03 — establish; Step 04 derives graph** |
| Dependency Analyzer | Missing | Step 04 |
| Model Registry | Missing | Step 05 |
| LLM Gateway / Model Router | Missing | Step 06 |
| Causal Observability | Authorization/audit correlation exists; full trace/span/event platform missing | Step 07 |
| Agent Runtime | Missing | Step 08 |
| RAG Runtime | Missing | Step 09 |
| Tool/MCP Runtime | Missing | Step 10 |
| Evaluation | Missing | Step 11 |
| FinOps | Missing | Step 12 |
| Marketplace | Missing | Step 13 |
| Copilot Studio | Missing | Step 14 |
| Terraform/production deployment | Missing | Step 15 |

Section 5 is a repository-state assessment, not an alternative requirements source. It must be refreshed again after Step 03 is actually completed and merged.

## 6. Step 01 readiness decision

**Historical decision: Step 01 was READY.**

The repository had no unresolved architectural contradiction blocking the foundation. The required technologies and boundaries were established by accepted ADRs, the v0.7 specification provided the requirements baseline, and the repository was sufficiently inspected to begin the first implementation step.

Step 01 remained limited to foundations and did not implement higher-level platform capabilities merely because the repository started empty.

## 7. Preconditions for activation

Before each implementation step begins:

- the prior step is complete and merged to `staging`;
- the implementation roadmap marks the next step `IN PROGRESS` only after prerequisites are complete;
- the implementation branch is created from the merged `staging` baseline;
- relevant ADRs are re-read from the current implementation branch;
- the repository state and Section 5 gap are reviewed before implementation.

## 8. Discovery conclusion

Step 01 and Step 02 have established the repository/platform and identity/authorization/policy foundations. Step 03 is now the controlled implementation step for the Artifact, Agent & Version Registry. No later capability should be implemented outside the Step 03 contract until Step 03 reaches `COMPLETE` under the roadmap's Definition of Done.
