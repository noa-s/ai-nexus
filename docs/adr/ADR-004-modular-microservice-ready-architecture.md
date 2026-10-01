# ADR-004: Modular, Microservice-Ready Architecture

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus is intended to demonstrate an enterprise-scale platform architecture, while v1 must remain implementable and operable by a small team. Treating the whole platform as a monolith would make future decomposition harder; prematurely deploying many microservices would add operational complexity without proportional value for the interview/demo.

The architecture therefore needs explicit logical service boundaries now, while allowing multiple boundaries to be deployed together during v1.

## Decision

AI Nexus will use **explicit logical service boundaries from the beginning**, while allowing multiple boundaries to be deployed together during v1.

Each major capability must have:

- a clear responsibility
- an explicit API/module contract
- isolated domain/application logic
- explicit domain-data ownership
- minimal coupling to other domains
- an identifiable future service boundary

**Logical service boundaries and deployable units are separate architectural dimensions.** A v1 deployment may combine several logical services into one deployable unit, while preserving the contracts and ownership boundaries required to split them later.

Candidate future service boundaries include:

- Integration Gateway
- Control Plane / lifecycle services
- Agent Registry
- Policy Registry
- Model Registry / LLM Gateway
- Agent Runtime
- Tool/MCP Runtime
- RAG/Knowledge Runtime
- Evaluation Runtime
- Observability/Telemetry pipeline
- FinOps/Usage service
- Marketplace

The initial deployment topology may group several logical services into fewer deployable units. A later transformation process/agent may automate or assist extraction of a logical service into an independently deployable microservice.

## Data ownership

Each logical service owns its domain data. Other services must not directly manipulate another service's domain tables.

For v1, multiple logical services may use the same PostgreSQL instance and database, but logical ownership boundaries must remain explicit. The schema should be organized so that future physical database separation is possible without redesigning domain responsibilities.

## Inter-service communication

Services communicate through explicit contracts rather than reaching into each other's internal implementation.

- **Synchronous communication** is appropriate for request/response operations where the caller requires an immediate result, such as governed runtime calls or registry lookups.
- **Asynchronous events/messages** are appropriate for telemetry, usage, evaluation, lifecycle notifications, and other work that does not need to block the initiating request.

The exact protocol and messaging technology will be selected in the implementation specification based on v1 requirements.

## Shared capabilities

Shared functionality belongs in a deliberately defined shared/platform space when it is genuinely cross-cutting, such as common contracts, identity context, authorization primitives, trace context, or security primitives.

Shared code must not become a mechanism for bypassing service/domain boundaries. Domain-specific business logic remains owned by its respective boundary.

## Consequences

- We can demonstrate enterprise architecture without operating an unnecessarily large microservice fleet in v1.
- Internal module boundaries must be treated as real architecture boundaries, not arbitrary folders.
- Domain data ownership reduces future extraction risk.
- Explicit synchronous/asynchronous contracts make later service decomposition more predictable.
- Shared platform capabilities remain reusable without creating hidden domain coupling.
- Deployment decomposition can evolve independently from logical architecture.
