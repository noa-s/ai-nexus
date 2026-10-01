# ADR-011: AI Security Architecture and Threat Controls

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus inherits ordinary platform threats and introduces AI-specific threats. The platform must protect enterprise data, identities, tools, models, agents, and execution paths while preserving auditability.

Relevant threats include:

### Conventional platform threats

- authentication bypass
- authorization errors
- credential/secret exposure
- insecure service-to-service communication
- tenant isolation failures
- injection attacks
- vulnerable dependencies
- data leakage
- excessive privileges
- denial of service/resource exhaustion
- confused-deputy behavior

### AI-specific threats

- prompt injection
- indirect prompt injection through retrieved content
- sensitive-data leakage/exfiltration
- tool abuse or unauthorized actions
- hallucinated tool/action proposals
- unsafe autonomous execution
- malicious or untrusted tool results
- model/provider compromise or outage
- model abuse and cost attacks
- unsafe generated content
- evaluation/release bypass
- insufficient provenance/traceability

## Decision

Security is a cross-cutting architecture concern with defense in depth. Security controls are enforced at the boundaries where the relevant decision or protected action occurs rather than relying on the LLM or a single upstream component to make security decisions correctly.

### Security boundaries

The principal boundaries include:

```text
User / Client
    |
    v
Identity / API Gate
    |
    v
Control Plane / Execution Plane
    |
    v
Agent Runtime
    |
    +---- LLM Gateway
    +---- RAG Runtime
    +---- Tool/MCP Runtime
                 |
                 v
          External systems
```

Each boundary applies the controls relevant to its responsibility. Downstream execution services do not blindly trust an upstream authorization decision when they are themselves responsible for protecting a resource or action.

### Identity

AI Nexus distinguishes **human identity** from **workload/service identity**.

A security decision may depend on:

- initiating human/user identity
- tenant/organization
- user roles/claims/permissions
- calling service/workload identity
- Agent identity/version
- target resource
- requested operation
- applicable policy versions

An Agent or service must not receive unrestricted authority merely because the initiating user has broad access. The effective authorization decision must account for the identities and constraints relevant to the action.

### Core controls

Controls include:

- strong authentication and service identity
- RBAC plus policy-based authorization where needed
- tenant/data isolation
- least-privilege and capability-based tool permissions
- immutable/versioned policy enforcement
- input/output validation
- data classification and access-aware retrieval
- secret isolation and dedicated secret-management mechanisms
- secure service-to-service communication
- rate limits, quotas, and resource budgets
- dependency and supply-chain scanning
- audit/security events
- evaluation and release gates
- human approval for policy-defined high-risk actions
- continuous monitoring and alerting

### Prompt injection and untrusted content

AI Nexus treats model-generated instructions, retrieved documents, and other external content as **untrusted data**, not as authorization or control instructions.

For example, a retrieved document may contain an instruction to ignore the Agent's policy and invoke a tool. The content may be supplied to the model as context, but it cannot authorize the requested operation.

```text
Retrieved content
      |
      v
    Model
      |
  action proposal
      |
      v
Tool/MCP Runtime
      |
 authorization + policy
      |
      +---- DENY
      |
      +---- APPROVAL
      |
      +---- ALLOW -> execute
```

### Tool security and capability boundaries

Tool access is treated as a hard security boundary. Authorization considers the tool identity, requested operation/capability, target/resource, initiating identity, workload/Agent identity, and applicable policy constraints.

Where appropriate, tools should expose narrow capabilities such as `email.read`, `email.search`, and `email.send` rather than one broad unrestricted capability.

LLM-generated tool calls are proposals only. The LLM cannot authorize its own proposed action.

### Confused-deputy protection

AI Nexus must prevent a highly privileged tool or connector from using its own authority to perform an action that the initiating user, Agent, or policy context does not permit.

For protected operations the platform must be able to establish:

- who initiated the request
- which workload/service is executing it
- on whose authority it is executing
- which resource is targeted
- which operation is requested
- which policies govern the action

### Secret isolation

Secrets and credentials must remain outside normal LLM context.

```text
Secret Store
     |
     v
Tool / Connector
     |
     v
External API
```

The architecture must not pass API keys, access tokens, or other secrets through the Agent or model merely because a downstream tool requires them.

### Tool abuse detection and response

The platform must not only deny forbidden actions. When an agent proposes or attempts a forbidden tool action, AI Nexus should:

1. block the action
2. emit a security event/alert according to severity
3. retain the relevant causal trace
4. record the policy and authorization decision
5. record the agent/model/runtime context that led to the proposal
6. make the event available for investigation

The trace must explain **why the attempted action occurred**, not merely record the final denial.

A security event must be correlated with the parent execution trace so investigators can reconstruct the sequence of model calls, retrieved content, tool proposals, policy decisions, approvals, and prior actions that led to the event.

### AI and software supply chain

Security review applies to the broader AI supply chain, including:

- application dependencies
- container/base images
- MCP/tool packages
- model/provider dependencies
- Agent artifacts
- prompts/configuration
- policies
- RAG knowledge sources

Versioned artifact relationships should participate in the dependency graph so security analysis and impact analysis can identify affected consumers.

### Security release gates

Security controls are part of the CI/CD and release process. Depending on artifact and change type, release gates may include:

- dependency/supply-chain scanning
- unit/integration security tests
- authorization/policy tests
- prompt-injection tests
- tool-abuse tests
- secret scanning
- artifact/dependency validation
- AI evaluation thresholds

A release must not bypass required security gates merely because the change is classified as an AI prompt/configuration change rather than application code.

## Consequences

- Security decisions occur before and during execution.
- AI-specific controls cannot rely on the model behaving correctly.
- Tool permissions become a hard security boundary.
- Security telemetry correlates with normal execution traces.
- Human approval can protect policy-defined high-risk operational actions.
- Secrets remain outside normal model context.
- Security architecture is tested as part of evaluation and CI/CD gates.
- Identity, policy, resource, and workload context can be reconstructed for material security decisions.
