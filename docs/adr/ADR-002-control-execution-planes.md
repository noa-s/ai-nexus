# ADR-002: Control Plane vs Execution Plane with Shared Capabilities

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus serves both platform-management operations and live user/agent execution. Mixing these responsibilities would allow configuration and administrative concerns to create unnecessary load and noise in execution paths.

Execution flows can still require authorization, permissions, policy checks, quotas, approvals, and constraints. Therefore, the separation cannot mean that the Execution Plane bypasses governance.

Some capabilities are needed by both planes and should have a common authoritative implementation rather than duplicated logic.

## Decision

AI Nexus will use a **Control Plane / Execution Plane separation**.

### Control Plane

Responsible for managing platform state and lifecycle, including:

- agent/artifact registration and lifecycle
- version and dependency management
- policy lifecycle, publication, and consumer assignment
- model/provider/tool/knowledge registries
- marketplace metadata and access workflows
- evaluation configuration and release gates
- governance workflows and administrative operations

The Control Plane manages policy lifecycle, but **policy definitions are not owned exclusively by the Control Plane**. Policies are shared, versioned governance artifacts with a common authoritative origin; execution components consume and enforce the applicable policy versions.

### Execution Plane

Responsible for handling live AI requests, including:

- request context creation
- runtime authorization and policy enforcement
- agent resolution
- planning/orchestration
- model calls
- RAG retrieval
- tool/MCP authorization and execution
- approvals required during execution
- response validation

### Shared capabilities

Capabilities required by both planes will be implemented as shared platform capabilities/services. Examples include:

- identity and tenant context
- authorization/policy decision capability
- access to the authoritative policy/configuration state
- secrets/credential access interfaces
- audit/event publication
- trace context propagation

The shared capability has one authoritative implementation; consumers in either plane use it through an explicit interface.

## Why separate the planes?

The separation provides two important benefits:

1. **Responsibility isolation:** lifecycle/configuration operations are separated from latency-sensitive execution.
2. **Early gating and load reduction:** requests can be rejected or constrained at earlier gates before expensive agent/model/tool execution begins. This reduces unnecessary load and noise on execution components.

The architecture must therefore support an early ingress/authorization gate before expensive execution, while retaining runtime authorization for actions that arise later in the flow.

## Consequences

- Execution cannot assume that a request is trusted merely because it entered the platform.
- Authorization and policy enforcement are runtime concerns as well as lifecycle concerns.
- Shared services must have stable contracts so both planes can consume them.
- The exact availability/caching strategy for shared policy decisions will be defined by the implementation specification according to security and consistency requirements; no bypass of required runtime authorization is implied.
- The separation creates natural future microservice boundaries without requiring every boundary to be independently deployed in v1.
