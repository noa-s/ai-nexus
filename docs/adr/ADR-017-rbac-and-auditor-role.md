# ADR-017: RBAC and the Auditor Role

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus serves users and workloads with different responsibilities: business users, AI builders, platform administrators, security/governance personnel, and people responsible for reviewing platform activity. Stage 3 planning introduced an Auditor role specifically to provide read-oriented visibility without granting operational modification rights.

Auditing also needs to be useful to automated analysis later, including a possible Auditor Agent operating under the same least-privilege role model.

RBAC alone is insufficient for enterprise authorization because access can depend on tenant, business unit, resource scope, data classification, environment, and other policy attributes. The authorization model therefore needs a role baseline plus policy constraints.

## Decision

AI Nexus will use **RBAC as a baseline access-control mechanism**, with policy attributes and constraints applied where role-only authorization is insufficient.

Conceptually:

```text
Identity / workload
       |
       v
RBAC role
       |
       v
Role permissions
       |
       v
Policy constraints
       |
       +--> tenant / business unit
       +--> resource scope
       +--> data classification
       +--> environment
       +--> action / target
       |
       v
Final authorization decision
```

The Auditor is a **role**, not a specific actor type. The role may be assigned to approved human or machine identities whose responsibilities require read-oriented investigation.

### Auditor permissions

An **Auditor** can inspect authorized:

- execution traces
- audit events
- security events
- policy decisions
- artifact/version history
- evaluation results
- cost/usage records
- marketplace and lifecycle history

The scope of visibility is governed by applicable authorization policies. An Auditor does not automatically receive unrestricted cross-tenant or unrestricted data-classification access.

An Auditor cannot by default:

- modify agents or policies
- approve their own requests
- execute operational tools
- change authorization assignments
- alter audit history
- delete audit evidence
- modify historical policy decisions or execution records

### Separation of evidence and administration

Audit evidence must be protected from modification by the role that consumes it. The platform should preserve separation between:

```text
Evidence producers
      |
      v
Immutable / protected audit evidence
      |
      v
Auditor / investigation consumers
```

Administrative capabilities that modify agents, policies, authorization assignments, or runtime configuration remain separate from the Auditor role.

### Auditor access is itself auditable

Reading sensitive audit evidence is itself a material security event. Auditor access should therefore generate an audit event containing the applicable actor/service identity, resource reference, timestamp, and authorization context, subject to data-classification and retention policies.

This creates an auditable chain such as:

```text
Auditor reads Trace T123
        |
        v
AUDIT_READ event
        |
        v
Protected audit history
```

### Auditor entities

The role may be assigned to:

- human audit/compliance personnel
- security personnel with audit responsibilities
- governance/risk/compliance personnel
- platform operations personnel when explicitly authorized
- an automated Auditor Agent operating with a dedicated service identity and the same least-privilege constraints

An automated Auditor Agent is not implicitly trusted because it is an agent; its permissions are governed exactly like other platform actors.

### Auditor Agent

An Auditor Agent may consume authorized platform evidence and produce:

- audit summaries
- security and policy insights
- compliance reports
- cost/usage analysis
- unusual-behavior findings
- causal-trace explanations

By default it is an **analysis/reporting actor**, not a remediation operator. Discovering a problem does not itself grant permission to modify the platform.

If automated remediation is introduced later, it must be represented as a separate explicitly authorized workflow/policy with its own execution permissions and approval requirements.

Conceptually:

```text
Auditor Agent
      |
      v
Dedicated service identity
      |
      v
Auditor role
      |
      v
Scoped read policies
      |
      v
Evidence / analysis
      |
      v
Report / insight
```

### Authorization and versioned decisions

Material authorization decisions should be traceable to the policy versions that governed them. An Auditor investigating a denied or permitted action should be able to follow:

```text
Trace / audit event
      |
      v
Authorization decision
      |
      v
Policy identifier + exact version
```

Historical evidence must not be rewritten merely because a policy is later replaced by a new immutable version.

### Auditor vs Administrator

The platform should preserve a clear separation of duties.

| Capability | Auditor | Administrator |
|---|---:|---:|
| Read authorized traces | Yes | Yes, subject to scope |
| Read authorized audit/security events | Yes | Yes, subject to scope |
| Inspect policy decisions | Yes | Yes |
| Modify agents | No | Yes, subject to policy |
| Modify policies | No | Yes, subject to governance |
| Assign roles | No | Yes, subject to governance |
| Execute operational tools | No by default | Policy-dependent |
| Delete/alter audit evidence | No | Highly restricted / not ordinary administration |

Administrator access to audit evidence does not imply permission to rewrite historical evidence.

## Consequences

- Read-only investigation is separated from administrative mutation.
- Authorization can combine RBAC with tenant, resource, classification, and other policy constraints.
- Audit analysis can be automated without granting broad execution privileges.
- Auditor access becomes itself auditable.
- Auditor Agents can provide useful analysis while remaining constrained by a dedicated least-privilege service identity.
- Historical evidence remains protected when policies or configurations change.
- RBAC can evolve toward richer attribute/policy-based authorization without replacing the role model.
