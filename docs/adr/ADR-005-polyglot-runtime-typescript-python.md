# ADR-005: Polyglot TypeScript/Node.js and Python Runtime Strategy

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

The role explicitly calls for proficiency in Python and modern deployment tooling. Stage 1 also identifies Python as a requirement to verify/strengthen. At the same time, the existing candidate strength and project preference are TypeScript/Node.js/NestJS/Nx.

Using only TypeScript would under-demonstrate Python; using Python for everything would discard an established strength. The platform also needs a realistic way for Python and Node.js components to communicate securely.

## Decision

AI Nexus will use a **polyglot architecture** with TypeScript/Node.js and Python as first-class implementation languages.

This does **not** require one repository per language or one Docker container per language. The repository will be organized as a monorepo initially, with independently bounded Node.js and Python applications/services where appropriate.

### Language selection principle

Language selection follows **service responsibility and ecosystem fit**, not artificial language symmetry. A service should use the language whose ecosystem, libraries, runtime characteristics, team maintainability, and operational needs best fit its responsibility.

As practical heuristics:

**Prefer TypeScript/Node.js when a service is primarily:**

- API and enterprise integration oriented
- request/response and I/O heavy
- orchestration or workflow coordination
- enterprise platform/business logic
- registry/configuration lifecycle management
- authentication/authorization integration
- real-time I/O or protocol integration such as MCP/tool interfaces

**Prefer Python when a service is primarily:**

- AI/ML/data-processing heavy
- evaluation or benchmarking focused
- embedding/reranking/model experimentation oriented
- document/content processing heavy
- numerical/statistical computation heavy
- dependent on Python-first AI/ML libraries
- offline or batch-processing oriented

These are heuristics, not absolute rules. A service may use either language when its actual requirements justify the choice.

### Initial v1 responsibility allocation

The detailed implementation specification will finalize exact boundaries, but the initial allocation is:

| AI Nexus capability | Primary language | Rationale |
|---|---|---|
| Integration/API Gateway | TypeScript/Node.js | Enterprise APIs and integrations |
| Control Plane APIs | TypeScript/Node.js | Platform lifecycle and transactional domain logic |
| Agent/Artifact Registry | TypeScript/Node.js | Registry and lifecycle management |
| Policy Registry | TypeScript/Node.js | Governance artifact lifecycle |
| LLM Gateway | TypeScript/Node.js | Provider abstraction and governed request handling |
| Model Router | TypeScript/Node.js | Routing and policy decisioning |
| Agent Runtime | TypeScript/Node.js | Orchestration and application-facing execution |
| Tool/MCP Runtime | TypeScript/Node.js | Protocol and tool execution boundary |
| Marketplace | TypeScript/Node.js | Enterprise application/API surface |
| RAG orchestration | TypeScript/Node.js | Runtime coordination and governance integration |
| Evaluation Engine/workers | Python | Evaluation and AI/data ecosystem |
| Retrieval/embedding/document workers | Python | AI/data processing where Python ecosystem is advantageous |
| Offline evaluation pipelines | Python | Experimentation and benchmarking |
| FinOps/Usage service | TypeScript/Node.js | Transactional usage/cost platform logic |
| Web UI | TypeScript | Frontend ecosystem |

This allocation is not intended to create artificial language symmetry. Components may move between languages if implementation evidence shows a better fit.

### Governed platform access

A Python component does not receive a special path around platform controls. For example, an evaluation worker that requires an LLM invocation should use the governed internal AI Nexus contract and LLM Gateway rather than creating an independent provider integration that bypasses routing, authorization, observability, or FinOps controls.

The same principle applies to Node.js components: implementation language does not determine permission to bypass platform boundaries.

### Inter-service communication

When Node.js and Python components are separate deployable processes, communication will use explicit internal contracts over secure service-to-service protocols. Candidate mechanisms include authenticated HTTP/gRPC for synchronous calls and an authenticated event/message mechanism for asynchronous work.

Service identity, authorization, TLS/network controls, request correlation, and schema validation are required for internal communication.

Cross-service communication must respect the data-ownership rule established by ADR-004. **No service may directly access or manipulate another service's domain-owned database tables, regardless of implementation language.** Shared PostgreSQL infrastructure in v1 does not change this ownership boundary.

### Containers

A Node.js service and Python service should normally run in **separate containers** when they are independently deployable. A single container containing both runtimes is reserved for cases where they are intentionally one deployable unit; it is not the default architecture.

## Consequences

- The project demonstrates both required languages without creating two disconnected projects.
- Language choices can be explained through service responsibility and ecosystem fit.
- Contracts between languages become explicit and testable.
- Services can later be independently deployed or scaled.
- CI/CD must test both language ecosystems.
- Shared API schemas/contracts must avoid language-specific coupling.
- Platform governance remains language-independent.
