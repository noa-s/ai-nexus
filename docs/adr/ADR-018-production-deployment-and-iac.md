# ADR-018: Production-Like Deployment and Infrastructure as Code

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies Terraform/IaC, Docker, CI/CD, observability, security, reliability, and Azure/Microsoft ecosystem familiarity as areas to demonstrate. AI Nexus is the portfolio project selected for production-like hosting because its architecture is intentionally aligned with the role requirements.

The project should demonstrate operational thinking without requiring every planned enterprise service to be deployed independently on day one.

AI Nexus is designed as an enterprise-scale platform and therefore must preserve explicit service boundaries even when v1 deploys some services together. A logical service must have an independently identifiable responsibility, configuration boundary, API contract, ownership boundary, and data-access boundary so it can later become an independently deployed microservice without a fundamental application redesign.

## Decision

AI Nexus will use a **production-like, containerized deployment architecture** with:

- containerized runtime components
- CI/CD through GitHub Actions
- reproducible infrastructure using Terraform/IaC where appropriate
- PostgreSQL + pgvector
- centralized observability
- environment separation
- secure secret injection
- health/readiness controls
- rollback/version-aware deployment strategy
- explicit service boundaries that can evolve into independently deployed microservices
- at least one production-like Microsoft ecosystem integration through Copilot Studio as established by ADR-016

### Logical service boundaries vs deployment units

The logical architecture and deployment topology are intentionally separate concerns.

For v1, several logical services may run in the same container/process or deployment unit where doing so reduces operational overhead. This must not create direct coupling between their internal modules or databases.

Example:

```text
Logical services
+------------------+  +------------------+  +------------------+
| Agent Runtime    |  | RAG Runtime      |  | Tool Runtime     |
+------------------+  +------------------+  +------------------+
        \                 |                 /
         \                |                /
          +--------------------------------+
          | v1 deployment grouping         |
          +--------------------------------+

Later:

Agent Runtime  -> independently deployed service
RAG Runtime    -> independently deployed service
Tool Runtime   -> independently deployed service
```

A service boundary is therefore not defined by whether it currently has its own container. It is defined by responsibility and contract. The architecture must avoid shared mutable internal state that would make later extraction unsafe.

### Microservice-readiness requirements

Each designated service boundary should have:

- explicit inbound API/event contract
- explicit outbound dependency contract
- no direct access to another service's private database tables
- service-owned data/schema boundary
- configuration boundary
- authentication/service identity boundary
- independent health/readiness semantics where applicable
- independent telemetry identity
- deterministic version/build identity
- tests that validate its public contract

Both Node.js/TypeScript and Python services follow the same service-boundary and database-ownership rules. Polyglot implementation does not permit one language to bypass the architecture.

### Polyglot deployment

AI Nexus may contain both Node.js/TypeScript and Python services because language selection follows service responsibility and ecosystem fit, as established by ADR-004.

Node.js/TypeScript is appropriate for platform/API-oriented services where TypeScript/NestJS/Nx provide strong application and integration ergonomics.

Python is appropriate for AI/data-heavy services where the Python ecosystem materially improves implementation, such as evaluation, data processing, model/ML experimentation, or specialized retrieval/AI workloads.

These are separate deployable services, not two applications running inside the same container by default.

For example:

```text
Node.js service container
        |
        | authenticated internal API / event
        v
Python service container
```

Internal communication must use authenticated service-to-service communication and explicit contracts. A Python service must not import another service's private Node.js modules, and a Node.js service must not import a Python service's private implementation. Neither service may directly access another service's private database tables.

A monorepo may still be used to manage both language implementations, but deployment artifacts remain independently buildable and deployable where the service boundary requires it. Repository layout is therefore not the same thing as deployment topology.

### Internal service security

Service-to-service communication must be authenticated and authorized. The design should support:

- workload/service identity
- encrypted transport
- least-privilege service permissions
- explicit allowed service-to-service calls
- correlation/trace propagation
- request validation
- timeout/retry/circuit-breaker behavior where appropriate

The platform must not treat the internal network as inherently trusted.

### Environment strategy

The architecture will distinguish at least:

1. **Local development** — Docker Compose or equivalent local orchestration, local development configuration, and safe test credentials.
2. **PR/CI validation** — isolated validation of code, contracts, migrations, dependency/version changes, security checks, tests, and infrastructure plans before merge.
3. **Staging/demo** — production-like configuration and the real Microsoft integration path used for interview demonstration.
4. **Production-like/production** — the same architectural controls with production-grade identity, secrets, policies, monitoring, scaling, backup, and recovery configuration as applicable.

Environment promotion should use immutable build/version identifiers rather than rebuilding different application code for each environment.

### CI/CD and pre-merge architecture validation

CI/CD is also an architectural enforcement mechanism. Before merging changes, the pipeline should validate, as applicable:

- unit/integration/contract tests
- lint/type checks
- security/dependency scanning
- container buildability
- database migration safety
- IaC validation and plan
- artifact/version consistency
- automated dependency-graph change detection described by the versioning architecture
- policy/configuration validation

Changes that invalidate a dependency relationship or deployment contract should be detected at PR/CI level before reaching a deployed environment.

### Infrastructure as Code

Terraform is the primary IaC approach for infrastructure that should be reproducibly provisioned. IaC should define infrastructure resources and their relationships rather than application business logic.

Where Azure services are selected, Terraform should provision the relevant Azure resources while application deployment remains handled by the CI/CD deployment mechanism.

The exact Azure hosting topology will be selected during implementation based on the v1 demonstration scope, cost, operational simplicity, and the ability to demonstrate enterprise deployment practices.

### Secrets and configuration

Secrets must never be committed to source control.

The architecture separates:

- source-controlled non-secret configuration
- environment-specific configuration
- secret values
- managed identities/service credentials where available

GitHub Actions secrets/variables and the selected deployment platform's secret-management mechanism are used for CI/CD and runtime secret injection as appropriate. Production-like runtime services should prefer managed identity/workload identity over long-lived static credentials where the platform supports it.

### Database deployment

PostgreSQL + pgvector is a platform data dependency, but logical service boundaries still own their data access. Services must not use arbitrary cross-service table access.

Schema changes must be versioned, reviewed, tested, and deployed through controlled migrations. A migration must be considered part of the application release contract when its compatibility affects running services.

### Observability and operations

Every deployed service must expose sufficient health and telemetry information for operations, including as applicable:

- liveness/health
- readiness
- service/version/build identity
- structured logs
- metrics
- distributed traces
- dependency failures
- deployment metadata

Telemetry must participate in the causal tracing model defined by ADR-013.

### Deployment and rollback

Deployments must be associated with immutable application/artifact versions. Rollback must be based on a known-good artifact/configuration combination rather than rebuilding source at rollback time.

Database migrations must follow a compatibility strategy that supports the required deployment/rollback sequence. Destructive schema changes should not be coupled to a deployment in a way that makes rollback impossible without an explicit migration strategy.

## Consequences

- The portfolio demonstrates deployment and operational maturity, not only application code.
- Terraform and CI/CD become executable architecture documentation.
- Logical service boundaries remain visible even when v1 groups services into fewer deployment units.
- The platform can evolve toward independently deployed microservices without redesigning the logical architecture.
- Node.js/TypeScript and Python services can coexist as independently deployable workloads with secure internal communication.
- CI/CD validates architecture-sensitive changes before they reach deployed environments.
- Production credentials and sensitive configuration use external secret management rather than source-controlled configuration.
- The deployment topology can evolve as scale, reliability, security, and organizational requirements increase.
