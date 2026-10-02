# Step 02 — Identity, Authorization & Policy Foundation

- **Status:** READY
- **Step:** 02
- **Depends on:** Step 01
- **Parent plan:** `docs/implementation/AI-Nexus-v1-Implementation-Plan.md`
- **Discovery:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`

## 1. Purpose

Establish the shared identity, authorization, policy, and protected service-to-service foundation required before AI Nexus introduces governed runtime capabilities.

This step implements the minimum authoritative policy and authorization boundary needed by later steps. It does not implement Agent Runtime, LLM access, RAG retrieval, Tool/MCP execution, or other governed execution capabilities.

## 2. Architectural authority

### Relevant ADRs

- ADR-002 — Control Plane / Execution Plane / Shared Capabilities
- ADR-004 — Modular, microservice-ready architecture and domain ownership
- ADR-005 — Node.js/TypeScript + Python polyglot architecture and explicit runtime boundaries
- ADR-010 — immutable versioned policies and effective policy composition
- ADR-011 — AI security architecture, identity, least privilege, service security, secret isolation, and defense in depth
- ADR-013 — causal traceability of identity and policy decisions
- ADR-017 — RBAC baseline, policy constraints, Auditor role, and separation of duties
- ADR-018 — authenticated service-to-service communication, environment separation, and deployment/security boundaries

### Relevant specification requirements

- FR-IAM-001 through FR-IAM-005
- FR-GOV-001 through FR-GOV-003
- FR-DEP-001
- NFR-SEC-001 through NFR-SEC-003
- NFR-TRACE-001 / NFR-TRACE-002
- NFR-REL-001
- NFR-MAINT-001 / NFR-MAINT-002
- Enterprise Architecture — identity and authorization boundary
- Logical Service / Module Boundaries — Policy/Authorization responsibility
- Data Architecture — domain ownership
- Runtime Architecture — authorization before protected execution
- Security Architecture and Threat Model
- Implementation Phase 1/2 dependencies and v1 acceptance targets

## 3. Source review requirement

Implementation MUST re-read the cited ADRs and the corresponding specification sections before coding. The ADRs remain authoritative for architectural decisions; this step specification converts those decisions into executable requirements and validation criteria.

## 4. Current repository baseline

Step 01 established the repository/application foundation, Node.js/TypeScript and Python runtime foundations, language-neutral contract location, PostgreSQL + pgvector foundation, configuration foundation, service/workload identity foundation, container support, and baseline CI.

Step 02 must inspect the actual Step 01 implementation before extending it. Existing implementation details must not silently redefine the accepted identity, policy, or authorization architecture.

## 5. Scope

Step 02 establishes:

1. human identity context at the protected API/Edge boundary;
2. workload/service identity representation for internal callers;
3. tenant/organization context propagation;
4. RBAC role and permission baseline;
5. immutable, versioned policy representation and shared authoritative Policy Registry boundary;
6. deterministic effective-policy evaluation and authorization decision contract;
7. authorization enforcement interfaces usable by both Control Plane and Execution Plane;
8. authenticated and authorized service-to-service communication foundation;
9. least-privilege defaults and explicit service permissions;
10. protected Auditor role and read-oriented evidence access boundary;
11. authorization decision audit/security events and trace correlation;
12. policy/identity data ownership and migration foundations;
13. automated tests for allow, deny, scope, policy, identity, and service-authorization cases.

## 6. Explicit non-scope

This step does NOT implement:

- generalized Agent/artifact registry behavior;
- Dependency Analyzer or dependency graph automation;
- Model Registry;
- LLM Gateway or provider adapters;
- Model Router;
- Agent Runtime execution lifecycle;
- RAG ingestion/retrieval;
- Tool/MCP registration or execution;
- evaluation runtime;
- FinOps/business-value attribution;
- Marketplace;
- Copilot Studio integration;
- production-scale identity-provider integration beyond the contracts/foundation required for the v1 protected boundary;
- broad production IAM administration UI;
- authorization bypasses for internal services or trusted networks.

## 7. Architectural constraints

### 7.1 Identity separation

The implementation MUST distinguish:

- initiating human/user identity;
- tenant/organization context;
- workload/service identity;
- Agent identity/version when available later;
- target resource;
- requested action;
- applicable policy versions.

A workload MUST NOT inherit unrestricted authority merely because the initiating human has broad permissions.

### 7.2 Control Plane / Execution Plane

Authorization and policy are shared capabilities consumed by both planes.

The Control Plane manages policy lifecycle and authorization configuration. The Execution Plane performs runtime authorization at protected action boundaries. Entering the platform does not imply trust.

The implementation MUST support an early authorization gate and subsequent runtime authorization checks for actions that arise later in execution.

### 7.3 Policy immutability

Policy definitions MUST be immutable after publication/version creation. Changes create a new policy version or policy artifact according to the governance model.

The implementation MUST preserve historical policy versions and assignment history required to reconstruct material authorization decisions.

Policy versions MUST have stable artifact identity/version metadata and explicit assignment/consumer references so they can participate in the platform-wide versioned dependency graph established by the Dependency Analyzer step. Step 02 establishes the references; dependency graph analysis remains Step 04 scope.

### 7.4 Effective policy composition

Authorization MUST support multiple applicable constraints rather than assuming one policy is authoritative.

The effective decision MUST be deterministic. A less restrictive or lower-priority rule MUST NOT silently override a stronger applicable security/authorization constraint.

The exact precedence/evaluation order used by v1 MUST be explicit, version-controlled, testable, and observable.

### 7.5 RBAC baseline

RBAC is the baseline access-control mechanism.

The model MUST support at least:

- identity-to-role assignment;
- role-to-permission mapping;
- scoped resource/action permissions;
- policy constraints over tenant, resource, data classification, environment, and action/target as applicable.

Roles are not authorization decisions by themselves; policy constraints remain part of the final decision.

### 7.6 Auditor role

Auditor is a role that provides scoped, read-oriented access to authorized evidence.

The Auditor role MUST be assignable to both human and machine/workload identities. An automated Auditor Agent receives no implicit authority because it is an Agent; it receives only explicitly granted identity, role, and policy permissions.

The evidence model is designed to support scoped read access to future evidence domains including execution traces, audit events, security events, policy decisions, artifact/version history, evaluation results, cost/usage records, and Marketplace/lifecycle history as those capabilities are implemented.

An Auditor MUST NOT by default:

- modify policies or agents;
- change role assignments;
- approve its own requests;
- execute operational tools;
- alter or delete audit evidence.

Auditor reads of sensitive evidence MUST themselves be auditable.

### 7.7 Service-to-service security

Internal network location MUST NOT be treated as sufficient trust.

Service-to-service calls MUST carry an authenticated workload/service identity and MUST be authorized against an explicit permitted caller → target → operation relationship and applicable policy constraints.

The receiving boundary MUST validate the authenticated request context and MUST NOT accept caller-supplied fields as proof of a stronger workload identity.

The implementation MUST support encrypted transport and least-privilege service permissions. The concrete transport/identity mechanism may be selected at implementation level as long as it satisfies the accepted ADR constraints and remains replaceable behind an explicit contract.

### 7.8 Secret isolation

Identity credentials, access tokens, API keys, and other secrets MUST remain outside model/application context where not required by the protected boundary. Step 02 MUST not introduce secret material into source control or ordinary authorization payloads.

### 7.9 Domain ownership

Identity/access, policy, and authorization data MUST have explicit ownership boundaries. Other domains may reference authorization decisions and policy versions through contracts but MUST NOT directly mutate Policy/Authorization-owned tables.

## 8. Logical boundaries and interfaces

Step 02 SHOULD preserve these logical responsibilities even if v1 deploys them together:

```text
API / Edge
   |
   v
Identity Context
   |
   v
Authorization Decision Service / Module
   |
   +---- RBAC
   +---- Policy Registry
   +---- Effective Policy Evaluation
   +---- Service Identity Authorization
   |
   +---- Audit / Decision Event
```

### 8.1 Authorization request

The language-neutral contract MUST represent, at minimum:

- request/correlation reference;
- actor/human identity reference where present;
- tenant/organization reference;
- caller workload/service identity;
- requested action/capability;
- target/resource reference;
- environment/context;
- relevant data classification/context where applicable;
- Agent identity/version when available;
- applicable policy references/versions where already resolved;
- authorization purpose/context.

### 8.2 Authorization decision

The decision contract MUST represent, at minimum:

- decision: `ALLOW`, `DENY`, or `APPROVAL_REQUIRED` where the policy model requires it;
- decision/reference ID;
- reason/error code;
- evaluated policy identifiers and exact versions;
- actor/workload context reference;
- target/action reference;
- evaluation timestamp/version;
- correlation/trace identifiers.

The decision MUST be suitable for audit and causal tracing without requiring raw sensitive payloads to be copied into every event.

### 8.3 Service authorization

A service-to-service authorization request MUST identify both the calling workload and target service/resource. A caller MUST NOT be able to claim a stronger service identity through user-controlled request data.

## 9. Policy lifecycle

The minimum lifecycle MUST support:

```text
DRAFT → ACTIVE → DEPRECATED → ARCHIVED
                  \
                   → REVOKED
```

The exact lifecycle transitions and who/what may perform them MUST be explicit and testable.

A policy version MUST have stable identity, immutable content after creation, lifecycle state, creation metadata, and sufficient assignment history to reconstruct which version governed a material decision.

The Policy Registry provides the shared authoritative origin for immutable policy versions. The Control Plane manages lifecycle operations and authorization configuration, while Execution Plane and shared capabilities consume and enforce applicable versions through explicit interfaces.

## 10. Security threat model for this step

The implementation and tests MUST address at least:

| Threat | Required control |
|---|---|
| Authentication bypass | protected boundary requires authenticated identity |
| Authorization bypass | enforce decisions at protected action boundaries |
| Privilege escalation | least privilege + explicit role/policy evaluation |
| Tenant escape | tenant-aware authorization constraints |
| Confused deputy | preserve initiating identity and workload identity separately |
| Forged workload identity | authenticated service identity, not caller-supplied claims alone |
| Policy tampering | immutable policy versions + controlled lifecycle |
| Policy rollback confusion | explicit version references and assignment history |
| Auditor privilege abuse | read-only scoped role + auditable reads |
| Secret exposure | credentials remain outside normal authorization/model context |
| Internal network trust abuse | authenticated + authorized service-to-service calls |
| Missing decision evidence | decision event + trace correlation |
| Authorization service failure | controlled failure; no silent bypass |

## 11. Data model requirements

The exact schema is implementation-level, but the ownership model MUST support entities equivalent to:

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

The implementation MUST retain exact policy-version references on material authorization decisions.

Historical decisions MUST remain interpretable after a policy version is deprecated, revoked, or replaced.

PolicyVersion records MUST expose the stable identity/version and assignment/consumer references needed by the later platform-wide dependency graph without making Step 02 responsible for implementing graph analysis.

## 12. Failure behavior

Authorization is a governance dependency. If the required authorization dependency is unavailable or cannot produce a trustworthy decision, protected operations MUST fail closed unless an explicitly defined, policy-authorized degraded/approval mode preserves the required governance controls. Unavailability MUST NOT result in implicit authorization.

Failures MUST be observable and correlated with the request/trace context where available.

## 13. Testing and validation

Tests MUST include:

### Identity

- authenticated human identity is propagated;
- workload identity is independently represented;
- tenant context cannot be replaced by an untrusted caller field;
- missing/invalid identity is rejected.

### RBAC

- allowed role/permission succeeds;
- missing permission is denied;
- resource scope is enforced;
- Auditor can read authorized evidence but cannot mutate protected resources;
- Auditor permissions work consistently for human and machine/workload identities;
- an Auditor Agent receives no implicit privileges beyond explicit assignments.

### Policy

- immutable policy versions cannot be modified in place;
- new policy versions can be assigned explicitly;
- multiple applicable policies are evaluated;
- precedence/conflict resolution is deterministic;
- exact policy versions appear in material decisions;
- policy versions retain stable artifact/version identity and assignment/consumer references suitable for later dependency analysis.

### Service-to-service

- authenticated workload identity is required;
- unauthorized service caller is denied;
- caller cannot impersonate another workload;
- caller → target → operation permissions are explicitly enforced;
- receiving boundaries validate the authenticated request context;
- transport/security requirements are enforced by the selected implementation.

### Failure/security

- authorization dependency failure does not bypass authorization;
- denial produces an auditable decision/event;
- sensitive credential material is not persisted in authorization records;
- security/authorization decisions correlate to trace/request context.

## 14. Acceptance criteria

- **AC-02-001:** Protected API operations have an authenticated identity context.
- **AC-02-002:** Human identity, tenant context, and workload/service identity are represented separately.
- **AC-02-003:** RBAC baseline supports roles, permissions, assignments, and scoped access.
- **AC-02-004:** Policy versions are immutable and have a shared authoritative Policy Registry origin.
- **AC-02-005:** Effective authorization supports multiple applicable policy constraints with deterministic conflict resolution.
- **AC-02-006:** Authorization decisions identify the exact policy version(s) that materially governed the decision.
- **AC-02-007:** Authorization can be invoked both at the API/Edge boundary and at later protected action boundaries.
- **AC-02-008:** Service-to-service calls require authenticated workload identity and explicit caller → target → operation authorization; internal network location alone is insufficient.
- **AC-02-009:** Auditor is a scoped, read-oriented role assignable to human and machine identities, and Auditor access is itself auditable.
- **AC-02-010:** Authorization dependency failure cannot silently bypass governance.
- **AC-02-011:** Authorization/security decisions are correlated with the causal request/trace context.
- **AC-02-012:** Identity/policy data ownership is explicit and cross-domain direct table mutation is not used.
- **AC-02-013:** No secrets are committed or embedded in identity/authorization contracts or tests.
- **AC-02-014:** Automated tests cover positive, negative, scope, policy, service-identity, failure, and audit cases.
- **AC-02-015:** Policy versions expose stable identity/version and assignment/consumer references compatible with the platform-wide dependency graph.
- **AC-02-016:** Step 02 remains compatible with later Agent Runtime, LLM Gateway, Tool/MCP, RAG, Evaluation, and Auditor capabilities without creating alternate authorization paths.

## 15. Definition of Done

Step 02 may be marked `COMPLETE` only when all of the following are true:

- [ ] All Step 02 acceptance criteria pass.
- [ ] Relevant ADRs were re-read during implementation.
- [ ] The implementation does not modify or reinterpret an accepted ADR decision.
- [ ] Human/workload identity boundaries are tested.
- [ ] RBAC and policy evaluation are tested.
- [ ] Policy immutability and historical version references are tested.
- [ ] Policy artifact/version references are suitable for later dependency analysis.
- [ ] Service-to-service authentication and authorization are tested.
- [ ] Authorization failure behavior is tested and fail-closed/controlled.
- [ ] Auditor permissions and auditable reads are tested for human and machine/workload identities.
- [ ] Authorization decisions are trace/audit correlated.
- [ ] No secret material is committed.
- [ ] CI passes and contains the Step 02 validation.
- [ ] No unrelated architecture/dependency changes are introduced.
- [ ] The Step 02 PR is reviewed and merged.
- [ ] The merged implementation is verified on `staging`.
- [ ] Completion evidence is recorded in the implementation plan/step record.

## 16. Exit condition

When Step 02 is complete, Step 03 may become `READY`. Later runtime capabilities MUST continue to use the shared authorization/policy interfaces established here rather than introducing parallel authorization or policy mechanisms.
