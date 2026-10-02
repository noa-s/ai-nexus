# ADR-010: Policies as Immutable Versioned Governance Artifacts

- **Status:** Accepted
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

### Effective policy composition

A runtime decision may be governed by multiple applicable policy versions at the same time. For example, a tool action may be constrained by user permissions, Agent policy, Tool policy, Data policy, and platform/security policy.

The runtime must evaluate the **effective policy set** for the protected action rather than assuming a single policy is authoritative.

```text
User constraints
      +
Agent constraints
      +
Capability constraints
      +
Data constraints
      +
Platform/security constraints
      |
      v
Effective policy decision
```

Where multiple policies apply, conflict resolution must be deterministic and defined by the platform's governance rules. A lower-priority or less restrictive policy must not silently override a stronger applicable security or authorization constraint.

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

The dependency graph must be maintained automatically rather than relying on developers to update a graph manually. Repository changes to versioned artifact declarations, including convention-based files such as `*.artifact.ts`, should be detected by the Dependency Analyzer and validated at PR/CI stages before merge or deployment.

### Policy assignment history

Consumer-to-policy-version assignments are auditable. The platform should retain the effective assignment history needed to determine which policy versions governed an artifact or execution at a given point in time.

For example:

```text
Agent v6 -> Policy A v2
Agent v7 -> Policy A v3
```

This history supports audit, rollback, impact analysis, and reconstruction of historical executions.

### Traceability

Execution traces must record the policy version(s) that governed material decisions.

## Consequences

- Historical executions remain explainable.
- Policy changes are explicit and reviewable.
- Consumers can be migrated deliberately.
- Policy rollback is possible by assigning a previous still-valid version where permitted.
- Effective policy decisions can account for multiple independent constraints.
- Dependency changes can be detected automatically before release.
- Governance becomes a cross-cutting concern with shared policy definitions and distributed enforcement.
