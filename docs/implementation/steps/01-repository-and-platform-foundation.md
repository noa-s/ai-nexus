# Step 01 — Repository & Platform Foundation

- **Status:** PLANNED
- **Step:** 01
- **Depends on:** None
- **Parent plan:** `docs/implementation/AI-Nexus-v1-Implementation-Plan.md`

## 1. Purpose

Establish the executable repository foundation required by every subsequent AI Nexus implementation step. This step creates the initial runtime, repository, contract, data, configuration, service-identity, and CI foundations without implementing higher-level platform capabilities.

## 2. Architectural authority

### Relevant ADRs

- ADR-001 — enterprise platform boundary
- ADR-002 — Control Plane / Execution Plane / Shared Capabilities
- ADR-004 — logical service/module boundaries and data ownership
- ADR-005 — TypeScript/Node.js + Python polyglot architecture
- ADR-006 — PostgreSQL + pgvector
- ADR-018 — containerized deployment, GitHub Actions, environments, health/readiness, and IaC readiness

### Relevant specification areas

- System goals and non-goals
- Functional requirements FR-DEP-001 through FR-DEP-004
- NFR-MAINT-001 / NFR-MAINT-002
- Enterprise Architecture
- Logical Service / Module Boundaries
- Data Architecture — PostgreSQL + pgvector
- Node.js / Python Runtime Allocation
- Implementation Phase 1
- AC-V1-013 and AC-V1-015/016/017 as downstream targets

## 3. Current repository baseline

The `staging` repository currently contains the accepted ADRs, v1 architecture specification, agent-governance guidance, and a minimal README. It does not yet contain the v1 application/service implementation. Step 01 therefore starts from a documentation-first repository rather than extending an existing application scaffold.

## 4. Scope

Step 01 will establish:

1. the monorepo/application/module structure required by the logical architecture;
2. Node.js/TypeScript runtime foundations;
3. Python runtime foundations;
4. language-neutral shared contracts and versioning conventions;
5. PostgreSQL + pgvector local/development foundation;
6. configuration/environment separation foundations;
7. service/workload identity foundations needed by later authenticated service communication;
8. baseline Docker/container development support where required;
9. baseline GitHub Actions CI validation;
10. repository conventions needed by subsequent implementation steps.

## 5. Explicit non-scope

This step does **not** implement:

- Agent Registry behavior;
- Policy Registry or final authorization behavior;
- Dependency Analyzer;
- Model Registry;
- LLM Gateway/provider adapters;
- Agent Runtime;
- RAG runtime behavior;
- Tool/MCP execution;
- evaluation runtime;
- FinOps;
- Marketplace;
- Copilot Studio integration;
- production Terraform resources beyond the minimum foundation required to keep later work structurally compatible.

Those capabilities belong to later controlled steps.

## 6. Required architectural constraints

- Logical service boundaries MUST be represented explicitly even if multiple boundaries are initially grouped into one deployable unit.
- Domain ownership MUST be explicit; shared PostgreSQL MUST NOT imply shared table ownership.
- Node.js and Python MUST remain independently identifiable runtimes.
- Cross-runtime contracts MUST be language-neutral.
- No service may use another service's private modules or domain-owned tables as an integration mechanism.
- No governed LLM execution path may be introduced outside the future LLM Gateway.
- Secrets MUST NOT be committed to the repository.
- Environment-specific configuration MUST remain distinct from source-controlled non-secret configuration.
- CI MUST be capable of becoming an architectural enforcement point for later dependency/security/evaluation gates.

## 7. Implementation requirements

### Repository structure

Define a structure that can support the logical service boundaries without prematurely creating a large microservice fleet.

The structure MUST make ownership and dependency direction visible and leave a clean path for later extraction into independently deployable services.

### Node.js / TypeScript

Establish the supported Node.js/TypeScript workspace and a minimal executable service/module foundation consistent with the later API/Control Plane/Execution Plane allocation.

### Python

Establish the Python workspace/runtime convention required by evaluation and AI/data workers. Python tooling MUST be independently executable and testable.

### Contracts

Establish a location and versioning convention for language-neutral contracts used between Node.js and Python and later between logical service boundaries.

The contract approach MUST NOT encode private implementation details from either language.

### PostgreSQL + pgvector

Provide a reproducible development database foundation with pgvector enabled and a migration mechanism suitable for later domain-owned schemas.

The step need not define all production tables. It MUST establish the migration/data-access conventions that later steps will use.

### Configuration and identity

Establish environment-aware configuration loading and the foundation for workload/service identity without embedding real production credentials.

### CI

Create a baseline GitHub Actions workflow that can validate the repository foundation. The workflow should be structured so later steps can add dependency analysis, security checks, evaluation, build, and deployment gates without replacing the entire CI architecture.

## 8. Acceptance criteria

- **AC-01-001:** The repository has a documented executable structure aligned with the logical service/module boundaries.
- **AC-01-002:** Node.js/TypeScript foundation builds and has at least one executable/testable application boundary.
- **AC-01-003:** Python foundation installs/builds/tests independently and has at least one executable/testable worker boundary appropriate for later AI/data work.
- **AC-01-004:** Node.js/Python communication contracts have a language-neutral, versioned home and validation convention.
- **AC-01-005:** PostgreSQL is reproducibly available for local development and pgvector is enabled.
- **AC-01-006:** Database changes use versioned migrations and do not require direct cross-domain table ownership.
- **AC-01-007:** Configuration is environment-aware and no secrets are committed.
- **AC-01-008:** A service/workload identity foundation exists without granting broad permissions by default.
- **AC-01-009:** Container/development orchestration is reproducible for the foundation services.
- **AC-01-010:** GitHub Actions performs the baseline repository validation required by the foundation.
- **AC-01-011:** The foundation does not introduce an alternate LLM/provider path or bypass any accepted governance boundary.
- **AC-01-012:** Documentation identifies what is established by Step 01 and what is intentionally deferred to later steps.

## 9. Validation

Before acceptance, determine and run the repository's applicable:

- Node.js install/build/typecheck/lint/test commands;
- Python install/typecheck/test commands;
- database migration/bootstrap validation;
- pgvector availability check;
- container build/start validation where applicable;
- GitHub Actions CI validation;
- secret/configuration safety checks.

If a required check cannot be run, record the reason rather than claiming full validation.

## 10. Definition of Done

Step 01 may be marked `COMPLETE` only when all of the following are true:

- [ ] All Step 01 acceptance criteria pass.
- [ ] The implementation is covered by appropriate automated tests.
- [ ] Node.js and Python foundations are independently buildable/testable.
- [ ] PostgreSQL + pgvector foundation is reproducible.
- [ ] Database ownership/migration conventions are documented.
- [ ] Configuration and secret boundaries are verified.
- [ ] Baseline CI passes.
- [ ] No unrelated architecture or dependency changes were introduced.
- [ ] Relevant ADRs were re-read during implementation and no decision was silently changed.
- [ ] The Step 01 PR is reviewed and merged.
- [ ] The merged implementation is verified on `staging`.
- [ ] Completion evidence is recorded in the implementation plan/step record.

## 11. Exit condition

When Step 01 is complete, Step 02 may become `READY`. No later implementation step may be treated as active merely because its design or code can be prepared in parallel; execution remains one controlled step at a time.
