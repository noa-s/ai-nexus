# ADR-017: RBAC and the Auditor Role

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus serves users with different responsibilities: business users, AI builders, platform administrators, security/governance personnel, and people responsible for reviewing platform activity. Stage 3 planning introduced an Auditor role specifically to provide read-oriented visibility without granting operational modification rights.

Auditing also needs to be useful to automated analysis later, including a possible Auditor Agent operating under the same least-privilege role model.

## Decision

AI Nexus will use RBAC as a baseline access-control mechanism, with policy attributes/constraints available where role-only authorization is insufficient.

An **Auditor** role is a read-oriented role that can inspect authorized:

- execution traces
- audit events
- security events
- policy decisions
- artifact/version history
- evaluation results
- cost/usage records
- marketplace and lifecycle history

An Auditor cannot by default:

- modify agents or policies
- approve their own requests
- execute operational tools
- change authorization assignments
- alter audit history

### Auditor entities

The role may be assigned to:

- human audit/compliance personnel
- security personnel with audit responsibilities
- governance/risk/compliance personnel
- platform operations personnel when explicitly authorized
- an automated Auditor Agent operating with a dedicated service identity and the same least-privilege constraints

An automated Auditor Agent is not implicitly trusted because it is an agent; its permissions are governed exactly like other platform actors.

## Consequences

- Read-only investigation is separated from administrative mutation.
- Audit analysis can be automated without granting broad execution privileges.
- RBAC can evolve toward attribute-based policies for tenant, business unit, data classification, and resource scope.
