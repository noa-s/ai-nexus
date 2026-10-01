# ADR-005: Polyglot TypeScript/Node.js and Python Runtime Strategy

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

The role explicitly calls for proficiency in Python and modern deployment tooling. Stage 1 also identifies Python as a requirement to verify/strengthen. At the same time, the existing candidate strength and project preference are TypeScript/Node.js/NestJS/Nx.

Using only TypeScript would under-demonstrate Python; using Python for everything would discard an established strength. The platform also needs a realistic way for Python and Node.js components to communicate securely.

## Decision

AI Nexus will use a **polyglot architecture** with TypeScript/Node.js and Python as first-class implementation languages.

This does **not** require one repository per language or one Docker container per language. The repository will be organized as a monorepo initially, with independently bounded Node.js and Python applications/services where appropriate.

### TypeScript/Node.js responsibilities

Node.js/TypeScript is the primary platform/API language for:

- external API and integration gateway
- control-plane APIs
- marketplace/API backend
- agent registry/lifecycle APIs
- shared contracts and platform orchestration where TypeScript is advantageous
- application-facing execution coordination
- web application/backend-for-frontend where needed

### Python responsibilities

Python will be used where it provides clear AI/data/scientific ecosystem value, such as:

- evaluation runners and evaluator implementations
- embedding/retrieval experiments or specialized RAG processing
- model/data analysis utilities
- offline evaluation pipelines
- selected AI/ML-heavy runtime components where Python libraries materially reduce complexity

The exact service allocation will be finalized in the detailed implementation specification. The goal is not to split code by language arbitrarily.

### Inter-service communication

When Node.js and Python components are separate deployable processes, communication will use explicit internal contracts over secure service-to-service protocols. Candidate mechanisms include authenticated HTTP/gRPC for synchronous calls and an authenticated event/message mechanism for asynchronous work.

Service identity, authorization, TLS/network controls, request correlation, and schema validation are required for internal communication.

### Containers

A Node.js service and Python service should normally run in **separate containers** when they are independently deployable. A single container containing both runtimes is reserved for cases where they are intentionally one deployable unit; it is not the default architecture.

## Consequences

- The project demonstrates both required languages without creating two disconnected projects.
- Contracts between languages become explicit and testable.
- Services can later be independently deployed or scaled.
- CI/CD must test both language ecosystems.
- Shared API schemas/contracts must avoid language-specific coupling.
