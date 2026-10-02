# Step 02 — Identity, Authorization & Policy Foundation

- **Status:** IN PROGRESS
- **Step:** 02
- **Depends on:** Step 01
- **Parent plan:** `docs/implementation/AI-Nexus-v1-Implementation-Plan.md`
- **Discovery:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`

## Purpose

Establish the shared identity, authorization, policy, and protected service-to-service foundation required before governed runtime capabilities.

## Architectural authority

Relevant accepted ADRs: ADR-002, ADR-004, ADR-005, ADR-010, ADR-011, ADR-013, ADR-017, ADR-018.

Implementation MUST re-read these ADRs and the corresponding v1 specification sections before coding. ADRs remain authoritative; this step converts those decisions into executable requirements and validation criteria.

## Scope

1. Human identity context at the protected API/Edge boundary.
2. Workload/service identity for internal callers.
3. Tenant/organization context propagation.
4. RBAC role/permission baseline plus policy constraints.
5. Immutable, versioned policy representation and shared authoritative Policy Registry boundary.
6. Deterministic effective-policy evaluation and authorization decision contract.
7. Authorization enforcement usable by Control Plane and Execution Plane.
8. Authenticated and authorized service-to-service communication foundation.
9. Least privilege and explicit service permissions.
10. Auditor role and scoped evidence access.
11. Authorization decision audit/security events and trace correlation.
12. Identity/policy data ownership and migration foundation.
13. Automated positive, negative, scope, policy, identity, service-authorization, audit, and failure tests.

## Non-scope

No Agent Runtime, LLM Gateway, Model Router, RAG runtime, Tool/MCP execution, Evaluation runtime, FinOps, Marketplace, Copilot Studio integration, Dependency Analyzer implementation, or production-scale external IdP integration. No broad IAM UI and no trusted-network authorization bypasses.

## Architectural constraints

### Identity separation

The implementation MUST distinguish initiating human identity, tenant/organization, workload/service identity, Agent identity/version when available, target resource, requested operation, and applicable policy versions. A workload MUST NOT inherit unrestricted authority from the initiating user's permissions.

### Control / Execution Plane

Authorization and policy are shared capabilities. Control Plane manages policy lifecycle/configuration; Execution Plane enforces authorization at protected action boundaries. Protected execution MUST support both an early gate and later runtime checks. Downstream protected boundaries MUST NOT blindly trust an upstream decision when they own the protected action.

### Policy

Policy versions are immutable after creation. Changes create a new version/policy. Historical versions and assignment history MUST remain reconstructable.

Policy versions MUST have stable artifact/version identity plus explicit assignment/consumer references so they can participate in the platform-wide dependency graph. Step 02 establishes references; Step 04 implements graph analysis.

The Policy Registry is the shared authoritative origin for immutable versions. Control Plane manages lifecycle operations; policy semantics are not an exclusive Control Plane concern. Execution/shared capabilities consume and enforce applicable versions.

Effective authorization MUST evaluate multiple applicable constraints deterministically. A less restrictive/lower-priority rule MUST NOT silently override a stronger applicable security constraint. The v1 precedence order MUST be explicit, versioned, tested, and observable.

### RBAC / Auditor

RBAC is the baseline; policy constraints apply over tenant/business unit, resource scope, data classification, environment, and action/target as applicable.

Auditor is a role, assignable to human or machine identities. An Auditor has scoped read access to authorized traces, audit/security events, policy decisions, artifact/version history, evaluation results, cost/usage records, and Marketplace/lifecycle history as those systems exist. Auditor cannot by default modify policies/agents, change assignments, approve its own requests, execute operational tools, or alter/delete evidence. Auditor reads are auditable.

An Auditor Agent receives no implicit privileges because it is an Agent and is an analysis/reporting actor by default; automated remediation requires a separate explicit workflow/policy.

### Service-to-service security

Internal network location is not sufficient trust. Calls MUST carry authenticated workload identity and be authorized against explicit caller → target → operation permissions plus applicable policy constraints. Receiving boundaries MUST validate authenticated request context and MUST NOT accept caller-supplied fields as proof of stronger identity.

The implementation MUST support encrypted transport and least-privilege service permissions. The concrete mechanism remains replaceable behind an explicit contract.

### Secret isolation

Credentials and secrets MUST remain outside normal model context and MUST NOT be committed or placed in ordinary authorization payloads.

### Domain ownership

Identity/access, policy, and authorization data have explicit ownership. Other domains reference decisions/policy versions through contracts and MUST NOT directly mutate Policy/Authorization-owned tables.

## Interfaces

### Authorization request

The language-neutral contract MUST represent request/correlation ID, human identity when present, tenant/organization, caller workload identity, requested capability/action, target/resource, environment/context, data classification when applicable, Agent identity/version when available, applicable policy references/versions, and authorization purpose/context.

### Authorization decision

The decision MUST represent `ALLOW`, `DENY`, or `APPROVAL_REQUIRED` where applicable; decision ID; reason/error code; evaluated policy IDs and exact versions; actor/workload reference; target/action; evaluation timestamp/version; and correlation/trace identifiers. It MUST support audit/causal tracing without copying raw sensitive payloads.

### Service authorization

A service authorization request MUST identify caller workload and target service/resource. User-controlled fields cannot establish a stronger service identity.

## Policy lifecycle

```text
DRAFT → ACTIVE → DEPRECATED → ARCHIVED
                  \
                   → REVOKED
```

Lifecycle transitions MUST be explicit and testable. A version's content is immutable while lifecycle status may change. Assignment history MUST permit reconstruction of which version governed a material decision.

## Security controls

| Threat | Required control |
|---|---|
| Authentication bypass | authenticated identity required at protected boundary |
| Authorization bypass | decision enforcement at protected action boundaries |
| Privilege escalation | least privilege + RBAC/policy evaluation |
| Tenant escape | tenant-aware constraints |
| Confused deputy | separate human/workload/Agent context |
| Forged workload identity | authenticated workload identity |
| Policy tampering | immutable versions + controlled lifecycle |
| Policy rollback confusion | explicit versions + assignment history |
| Auditor abuse | scoped read-only role + auditable reads |
| Secret exposure | credentials outside normal model context |
| Internal network trust abuse | authenticated + authorized service calls |
| Missing evidence | decision event + trace correlation |
| Authorization failure | controlled fail-closed behavior |

## Data model

The ownership model MUST support entities equivalent to:

```text
Principal / HumanIdentity
WorkloadIdentity
Tenant / OrganizationContext
Role
Permission
RoleAssignment
Policy
PolicyVersion
PolicyAssignment
AuthorizationDecision
AuthorizationEvent
```

Material decisions MUST retain exact policy-version references. Historical decisions remain interpretable after policy replacement. PolicyVersion records expose stable identity/version and assignment/consumer references for later dependency analysis.

## Failure behavior

If authorization is unavailable or cannot produce a trustworthy decision, protected operations MUST fail closed unless an explicitly defined, policy-authorized approval/degraded mode preserves required governance controls. Unavailability MUST NOT imply authorization. Failures MUST be trace/audit correlated where context exists.

## Testing requirements

Tests MUST prove:

- human/workload identity separation and missing/invalid identity rejection;
- tenant context cannot be replaced by an untrusted caller field;
- RBAC allow/deny and resource scope;
- Auditor human/machine permissions and auditable reads;
- Auditor Agent has no implicit privilege;
- immutable policy versions and explicit new-version assignment;
- deterministic multi-policy evaluation and exact policy-version references;
- stable policy artifact/version and assignment/consumer references;
- authenticated service identity and caller → target → operation authorization;
- workload impersonation is rejected;
- receiving-boundary request validation;
- authorization failure cannot bypass governance;
- denial creates an auditable decision/event;
- sensitive credentials are not persisted;
- authorization/security decisions correlate to request/trace context.

## Acceptance criteria

- **AC-02-001:** Protected API operations have authenticated identity context.
- **AC-02-002:** Human, tenant, and workload identities are represented separately.
- **AC-02-003:** RBAC supports roles, permissions, assignments, and scoped access.
- **AC-02-004:** Policy versions are immutable and have a shared authoritative Policy Registry origin.
- **AC-02-005:** Effective authorization evaluates multiple constraints deterministically.
- **AC-02-006:** Material decisions identify exact governing policy versions.
- **AC-02-007:** Authorization exists at API/Edge and later protected action boundaries.
- **AC-02-008:** Service calls require authenticated workload identity and explicit caller → target → operation authorization.
- **AC-02-009:** Auditor is scoped, read-oriented, assignable to human/machine identities, and its access is auditable.
- **AC-02-010:** Authorization failure cannot silently bypass governance.
- **AC-02-011:** Authorization/security decisions correlate to causal request/trace context.
- **AC-02-012:** Identity/policy ownership is explicit and cross-domain direct table mutation is not used.
- **AC-02-013:** No secrets are committed or embedded in contracts/tests.
- **AC-02-014:** Automated tests cover positive, negative, scope, policy, service identity, failure, and audit cases.
- **AC-02-015:** Policy versions expose stable identity/version and assignment/consumer references compatible with the dependency graph.
- **AC-02-016:** Later runtime capabilities use these shared authorization/policy interfaces rather than alternate paths.

## Definition of Done

- [ ] All acceptance criteria pass.
- [ ] Relevant ADRs were re-read during implementation.
- [ ] No accepted ADR decision was modified or reinterpreted.
- [ ] Identity, RBAC, policy, service authorization, Auditor, failure, audit, and trace behavior are tested.
- [ ] Policy references are suitable for later dependency analysis.
- [ ] No secret material is committed.
- [ ] CI passes with Step 02 validation.
- [ ] No unrelated architecture/dependency changes are introduced.
- [ ] Step 02 PR is reviewed and merged.
- [ ] Merged implementation is verified on `staging`.
- [ ] Completion evidence is recorded in the implementation plan.

## Exit condition

When Step 02 is complete, Step 03 may become `READY`. Later runtime capabilities MUST continue using these shared authorization/policy interfaces.
