# Step 02 — Identity, Authorization & Policy Foundation

- **Status:** IN PROGRESS
- **Step:** 02
- **Depends on:** Step 01
- **Parent plan:** `docs/implementation/AI-Nexus-v1-Implementation-Plan.md`
- **Discovery:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`

## 1. Purpose

Establish the shared identity, authorization, policy, and protected service-to-service foundation required before AI Nexus introduces governed runtime capabilities.

This step implements the authorization/policy boundary and its contracts. It does not implement the later runtime capabilities themselves.

## 2. Architectural authority

The implementation MUST be compared directly with these accepted ADRs before coding and during final review:

- ADR-002 — Control Plane / Execution Plane / Shared Capabilities
- ADR-003 — Immutable Versioned Artifacts / Dependency Graph
- ADR-004 — Modular, Microservice-Ready Architecture / Data Ownership
- ADR-005 — TypeScript/Node.js + Python Polyglot Runtime
- ADR-006 — PostgreSQL + pgvector Data Foundation
- ADR-010 — Immutable Versioned Policies
- ADR-011 — AI Security Architecture
- ADR-013 — Causal Observability / Tracing
- ADR-017 — RBAC / Auditor Role
- ADR-018 — Production-Like Deployment / Service Security

The v1 Requirements & Architecture Specification is the requirements index. The ADRs remain authoritative for architectural decisions.

## 3. Scope

Step 02 establishes:

1. human identity context at the API/Edge boundary;
2. workload/service identity representation;
3. tenant/organization context propagation;
4. RBAC roles, permissions, assignments, and policy constraints;
5. a Policy Registry boundary for immutable, versioned policy artifacts;
6. policy lifecycle and assignment history;
7. deterministic effective-policy evaluation;
8. language-neutral authorization request/decision contracts;
9. early API/Edge authorization and a reusable downstream runtime authorization boundary;
10. explicit workload caller → target service → operation authorization;
11. Auditor evidence-read authorization and auditable Auditor reads;
12. authorization decision/audit-event storage boundary;
13. PostgreSQL schemas and migration protections for policy/authorization/audit data;
14. causal request/trace references on material decisions/events;
15. controlled failure when the authorization dependency is unavailable;
16. tests covering identity, policy, RBAC, tenant scope, service identity, Auditor, downstream authorization, audit, and failure behavior.

## 4. Explicit non-scope

This step does NOT implement:

- Agent/artifact registry lifecycle;
- Dependency Analyzer / automated dependency graph implementation;
- Model Registry;
- LLM Gateway / provider adapters / Model Router;
- Agent Runtime execution lifecycle;
- RAG ingestion/retrieval;
- Tool/MCP registration or execution;
- Evaluation runtime;
- FinOps/business-value attribution;
- Marketplace;
- Copilot Studio integration;
- production external IdP integration;
- production service mesh or managed workload identity;
- broad IAM administration UI;
- production observability backend;
- authorization bypasses for internal services or trusted networks.

The development signed-token implementation is a replaceable authentication adapter, not the production enterprise identity solution.

## 5. ADR-to-implementation constraints

### 5.1 ADR-002 — Control / Execution Plane

Authorization and policy are shared capabilities. The Control Plane manages lifecycle/configuration; the Execution Plane enforces authorization at protected action boundaries.

The implementation MUST support:

- an early API/Edge authorization gate;
- later runtime authorization for protected actions;
- no implicit trust merely because a request entered the platform;
- one shared authorization implementation rather than separate Control/Execution policy logic.

### 5.2 ADR-003 — Versioned artifacts / dependency graph

Policy versions are versioned artifacts. Each policy version MUST expose stable identity/version metadata and explicit consumer/assignment references so the future Dependency Analyzer can derive policy relationships automatically.

Step 02 establishes those references. Dependency graph computation remains Step 04.

### 5.3 ADR-004 — service and data boundaries

Identity, policy, authorization, and audit responsibilities have explicit logical ownership. Other domains consume them through contracts and MUST NOT directly mutate their domain-owned tables.

The PostgreSQL schemas in this step are separate logical domains even though v1 uses one physical PostgreSQL instance.

### 5.4 ADR-005 — polyglot boundary

The authorization contract is language-neutral. Neither Node.js nor Python receives a governance bypass because of implementation language.

### 5.5 ADR-006 — PostgreSQL data foundation

PostgreSQL is the relational foundation for identity, policy, authorization, and audit metadata. The Step 02 migration establishes the logical schemas and immutable evidence/version constraints.

### 5.6 ADR-010 — immutable versioned policies

Policy versions are immutable artifacts. Changes create new versions. Lifecycle status may change without changing policy content. Consumer assignment history is retained. Execution/shared capabilities consume applicable versions; policy semantics are not exclusively owned by the Control Plane.

Effective authorization may use multiple policy versions. Conflict resolution is deterministic, and a stronger security/authorization constraint cannot be silently overridden by a weaker one.

### 5.7 ADR-011 — security boundaries

Human and workload identity are distinct. Authorization is enforced at the boundary where a protected action occurs. Downstream execution must not blindly trust upstream authorization.

Secrets remain outside ordinary authorization/model context. User-controlled fields cannot establish a stronger workload identity.

### 5.8 ADR-013 — causal observability

Material authorization decisions and security/audit events carry request/trace correlation and exact policy-version references. Raw sensitive payloads are not required in every event.

### 5.9 ADR-017 — RBAC / Auditor

RBAC is the baseline. Policy constraints add tenant, business-unit, resource, classification, environment, and action/target restrictions where required.

Auditor is a role assignable to human or machine identities. Auditor has scoped read access to authorized evidence and cannot mutate policies, assignments, agents, or audit history by default. Auditor reads are themselves auditable.

An Auditor Agent receives no implicit privilege because it is an Agent. Automated remediation is a separate explicitly authorized workflow.

### 5.10 ADR-018 — service security / deployment boundary

Internal network location is not sufficient trust. Service-to-service calls require authenticated workload identity and explicit caller → target → operation authorization. Receiving boundaries validate the authenticated identity context.

The development implementation isolates the identity/authentication mechanism behind a replaceable boundary. Production deployment must provide encrypted service transport and managed/workload identity as selected by the production topology.

## 6. Identity model

The v1 identity context distinguishes:

- `subject`;
- `principalType`: `human` or `workload`;
- `tenantId`;
- roles;
- optional `workloadId`;
- optional `agentId`.

An Agent is context associated with a workload identity; it is not a third principal type in Step 02.

Signed development tokens MUST validate principal type, required fields, roles, expiration, and optional identity fields before an identity becomes trusted application context.

Optional fields MUST be omitted when absent rather than materialized as `undefined` claims.

## 7. Authorization model

### 7.1 RBAC baseline

The model supports:

- identity → role assignment;
- role → permission mapping;
- action/target permissions;
- tenant/resource scope;
- policy constraints.

Roles alone do not constitute the final authorization decision.

### 7.2 Effective policy evaluation

The authorization engine evaluates applicable policy constraints and role permissions deterministically.

Policy constraints are ordered deterministically by priority and stable identity/version tie-breakers. A matching deny constraint prevents authorization.

### 7.3 Tenant isolation

The identity tenant and request tenant MUST agree before authorization succeeds. A caller cannot replace tenant context through an untrusted request field.

### 7.4 Service-to-service authorization

A service call requires:

- `principalType = workload`;
- a non-empty authenticated `workloadId`;
- an explicit target service;
- an explicit operation/action;
- a policy/RBAC permission for that caller → target → operation relationship.

A human identity carrying a user-controlled `workloadId` MUST NOT become a service identity.

## 8. Policy Registry boundary

The Policy Registry is the shared authoritative logical origin for immutable policy versions.

The implementation provides a registry interface and development adapter that supports:

- creation of a policy version once;
- retrieval by policy ID + exact version;
- lifecycle transitions without mutating immutable content;
- explicit consumer assignments;
- assignment history;
- construction of the effective policy set for a consumer.

The PostgreSQL migration establishes the corresponding persistent policy/version/assignment schema and immutability protection. The development adapter is intentionally replaceable by the production persistence adapter without changing authorization contracts.

Policy versions expose stable artifact/version identity and consumer references for the later Dependency Analyzer.

## 9. Policy lifecycle

The minimum lifecycle is:

```text
DRAFT → ACTIVE → DEPRECATED → ARCHIVED
                  \
                   → REVOKED
```

Policy content is immutable after creation. Lifecycle status may change according to explicit lifecycle operations.

A policy that is not `ACTIVE` MUST NOT become a new consumer assignment.

Historical assignment records remain available so the platform can reconstruct which exact policy version governed a material decision.

## 10. Authorization contracts

The language-neutral request contract represents:

- request ID;
- human actor reference when present;
- tenant/organization;
- workload reference;
- Agent reference when applicable;
- action/capability;
- target/resource;
- environment/data classification when applicable;
- policy references/versions when already resolved;
- purpose/context.

The decision contract represents:

- `ALLOW`, `DENY`, or `APPROVAL_REQUIRED`;
- decision ID;
- reason code;
- request ID;
- tenant/organization;
- human actor reference when present;
- workload reference when present;
- Agent reference when applicable;
- action/capability;
- target/resource;
- exact governing policy versions;
- evaluation timestamp;
- trace correlation.

## 11. Auditor / evidence boundary

The implementation provides a scoped evidence-read boundary for authorization events.

Auditor access is authorized through the same RBAC/policy mechanism. Evidence is filtered to the Auditor's tenant scope. A successful evidence read emits an `AUDIT_READ` event containing the actor/workload, tenant, resource reference, request, trace, and policy context.

The application uses an `AuditEventStore` boundary with a development in-memory implementation. PostgreSQL provides the persistent schema and protects stored evidence from mutation.

This is a foundation for the future Auditor capability; it does not implement the complete enterprise investigation UI/Agent.

## 12. Audit and causal evidence

Authorization decisions produce audit events containing:

- principal/workload reference;
- Agent reference when applicable;
- tenant;
- request ID;
- decision ID;
- requested action;
- target/resource;
- decision/reason;
- exact policy versions;
- trace ID where available;
- timestamp.

The PostgreSQL audit table is protected against UPDATE, DELETE, and TRUNCATE mutation. The audit store abstraction allows the storage implementation to be replaced without changing authorization behavior.

## 13. Failure behavior

Authorization is a governance dependency.

If the policy provider cannot produce a trustworthy policy set, the protected operation MUST fail closed. The API boundary returns a controlled `503 authorization_unavailable` response with the request ID rather than executing the protected action.

No unavailable-policy condition may implicitly become `ALLOW`.

## 14. Downstream runtime boundary

The `authorizeRuntimeAction` boundary exists specifically so later Execution Plane components can perform their own protected-action authorization.

The Step 02 tests demonstrate that an upstream API authorization result does not automatically authorize a downstream protected operation.

This boundary is intentionally reusable by the future Agent Runtime, Tool/MCP Runtime, RAG authorization filters, and other protected execution services.

## 15. PostgreSQL data model

The migration establishes:

```text
identity.principal
identity.workload

authorization.role
authorization.permission
authorization.role_permission
authorization.role_assignment
authorization.service_permission
authorization.decision
authorization.event

policy.policy
policy.policy_version
policy.policy_assignment
```

Logical ownership remains explicit despite the shared physical PostgreSQL instance.

Policy content/version identity is protected from UPDATE/DELETE/TRUNCATE mutation while lifecycle status remains changeable. Authorization evidence is protected from UPDATE/DELETE/TRUNCATE mutation.

## 16. Security threat coverage

| Threat | Step 02 control |
|---|---|
| Authentication bypass | protected boundary requires validated identity |
| Forged principal type | signed-token runtime validation |
| Workload impersonation | workload-only service authorization |
| Authorization bypass | API and downstream runtime boundaries |
| Privilege escalation | RBAC + policy constraints |
| Tenant escape | identity/request tenant equality |
| Confused deputy | human/workload/Agent context separation |
| Policy tampering | immutable policy content/version |
| Policy rollback confusion | exact versions + assignment history |
| Auditor abuse | scoped read role + auditable reads |
| Audit tampering | immutable PostgreSQL evidence trigger |
| Secret exposure | development secret example only; no real secrets |
| Internal network trust | explicit workload/service authorization |
| Authorization dependency failure | controlled fail-closed response |
| Missing causal evidence | request/trace/policy references |

## 17. Testing requirements

Tests MUST cover:

### Identity

- human token round-trip;
- workload token round-trip;
- Agent context round-trip;
- optional claims omitted when absent;
- unsupported principal type rejected;
- invalid signature rejected;
- expired token rejected;
- malformed required/optional identity claims rejected.

### RBAC / policy

- allowed access;
- missing permission denied;
- tenant mismatch denied;
- deterministic deny precedence;
- policy-version reference included in decisions;
- duplicate policy version rejected;
- DRAFT policy cannot be assigned;
- lifecycle transition preserves immutable content;
- assignment history retained.

### Service-to-service

- workload identity required;
- explicit target/action permission required;
- human identity cannot impersonate a workload;
- caller → target → operation relationship is enforced.

### Auditor

- human Auditor can read authorized evidence;
- workload Auditor can read authorized evidence;
- other tenant cannot read evidence;
- Auditor read emits `AUDIT_READ`;
- Auditor role does not grant mutation capability.

### Runtime / failure

- downstream authorization is independently evaluated;
- policy dependency failure returns controlled failure;
- no protected operation executes when authorization is unavailable.

### Database

CI MUST apply migrations 001 and 002. CI MUST verify:

- pgvector availability;
- Step 02 schema creation;
- policy lifecycle status can change;
- policy content cannot be changed/deleted/truncated;
- audit evidence cannot be changed/deleted/truncated.

## 18. Acceptance criteria

- **AC-02-001:** Protected API operations have validated authenticated identity context.
- **AC-02-002:** Human, tenant, workload, and optional Agent context are represented separately.
- **AC-02-003:** RBAC supports roles, permissions, assignments, and scoped access.
- **AC-02-004:** A Policy Registry boundary provides immutable version identity and assignment history.
- **AC-02-005:** Policy content cannot be mutated in place; lifecycle status may change without changing content.
- **AC-02-006:** Effective authorization evaluates multiple constraints deterministically.
- **AC-02-007:** Material decisions contain exact governing policy versions and causal correlation.
- **AC-02-008:** API/Edge authorization and a reusable downstream runtime authorization boundary both exist.
- **AC-02-009:** Service calls require authenticated workload identity and explicit caller → target → operation authorization.
- **AC-02-010:** Human identities cannot establish workload authority through caller-controlled fields.
- **AC-02-011:** Auditor is scoped, read-oriented, assignable to human and machine identities, and its evidence reads are auditable.
- **AC-02-012:** PostgreSQL schemas enforce logical ownership and protect policy/audit evidence from mutation.
- **AC-02-013:** Authorization dependency failure cannot silently bypass governance.
- **AC-02-014:** Language-neutral request/decision contracts exist under `packages/contracts/v1`.
- **AC-02-015:** Policy versions expose stable artifact/version and consumer references compatible with the future dependency graph.
- **AC-02-016:** No alternate authorization mechanism is introduced for later runtime capabilities.
- **AC-02-017:** CI validates the Step 02 database migration and immutability controls.

## 19. Definition of Done

Step 02 may become `COMPLETE` only when:

- [ ] All acceptance criteria pass.
- [ ] Relevant ADRs were re-read during implementation and final review.
- [ ] No accepted ADR decision was modified or silently reinterpreted.
- [ ] Identity validation and human/workload separation are tested.
- [ ] RBAC, tenant scope, policy evaluation, lifecycle, and assignment history are tested.
- [ ] Service-to-service authorization is tested against explicit caller/target/action permissions.
- [ ] Auditor human/workload evidence reads and `AUDIT_READ` are tested.
- [ ] Downstream runtime authorization is independently exercised.
- [ ] Authorization dependency failure is tested fail-closed.
- [ ] Audit and policy database protections are validated in CI.
- [ ] No secrets are committed.
- [ ] Node CI passes.
- [ ] Database CI passes.
- [ ] No unrelated architecture/dependency changes are introduced.
- [ ] PR #18 is reviewed and merged.
- [ ] The merged implementation is verified on `staging`.
- [ ] Completion evidence is recorded in the implementation plan.

## 20. Exit condition

Only after Step 02 is `COMPLETE` may Step 03 become `READY`.

Later runtime capabilities MUST consume the shared identity, authorization, policy, and audit interfaces established here rather than introducing parallel authorization or policy mechanisms.
