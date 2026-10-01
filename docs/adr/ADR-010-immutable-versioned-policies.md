# ADR-010: Policies as Immutable Versioned Governance Artifacts

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Governance is cross-cutting. Policies should not be treated as mutable configuration owned solely by the Control Plane because execution, control, and shared platform capabilities all consume them.

A policy behaves like a contract: once a version is used, its exact terms must remain available so historical decisions remain explainable.

## Decision

Policies are **immutable, versioned governance artifacts** with a shared authoritative origin: the Policy Registry.

Policy versions cannot be edited after creation. If the rules change, a new policy version is created (or, where semantically appropriate, a new policy is created) and consumers are explicitly moved to the new version.

The Control Plane manages policy lifecycle operations such as creation, review, approval, publication, deprecation/revocation, and consumer assignment. It does not own the policy semantics as an exclusive Control Plane concern.

Execution Plane components enforce the applicable policy version at runtime.

### Policy types

The registry may contain distinct policy artifact types, including:

- access policy
- agent policy
- tool policy
- model policy
- data policy
- RAG policy
- security policy
- approval policy
- cost/budget policy
- rate-limit policy
- retention policy

### Lifecycle

A version can be immutable while its lifecycle status changes, for example:

```text
DRAFT -> ACTIVE -> DEPRECATED -> ARCHIVED
                       \
                        -> REVOKED
```

Revocation does not mutate the policy definition. It changes whether new execution/consumers may use that version according to platform rules.

### Dependency graph

Policies participate in the same versioned dependency graph as other artifacts. A consumer such as an agent or tool references explicit policy versions, allowing impact analysis when a new policy version is introduced.

### Traceability

Execution traces must record the policy version(s) that governed material decisions.

## Consequences

- Historical executions remain explainable.
- Policy changes are explicit and reviewable.
- Consumers can be migrated deliberately.
- Policy rollback is possible by assigning a previous still-valid version where permitted.
- Governance becomes a cross-cutting concern with shared policy definitions and distributed enforcement.
