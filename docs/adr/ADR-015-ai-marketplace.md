# ADR-015: Governed AI Marketplace and Conversational Discovery

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus is intended to enable an organization-wide AI service model, not only a platform for AI builders. Different personas need different entry points to governed AI capabilities, including business users, developers, data scientists, managers, governance/security teams, and executives.

Stage 1 identifies an internal AI marketplace as an Ormat requirement, with a lifecycle of discovery, evaluation, access request, approval, use, monitoring, and audit. Stage 2 positions AI Nexus as an enterprise enablement platform rather than an isolated AI application.

Employees will not necessarily know which Agent exists or which Agent best matches their task. Marketplace discovery therefore needs both conventional catalog/search capabilities and a governed conversational discovery experience.

A fixed cost/request displayed as a commitment is misleading because model choice, token usage, retries, routing, and workload vary dynamically. The marketplace may expose historical or estimated economics and configured maximum-cost constraints, but must not present dynamic execution cost as a guaranteed fixed price.

## Decision

AI Nexus will provide a governed internal **AI Marketplace** for discovering and accessing registered AI capabilities.

The marketplace will provide:

1. catalog/search discovery
2. conversational discovery that helps users describe their need and suggests appropriate registered Agents/capabilities
3. capability evaluation information
4. access-request and approval workflows
5. governed launch/use of the selected capability
6. links to monitoring, evaluation, cost, and audit information according to the user's permissions

The Marketplace is a discovery and governance surface. It does not become a second Agent Runtime or bypass the governed execution path.

### Marketplace discovery

Conventional discovery may use:

- full-text search
- capability/category metadata
- business domain
- owner/business unit
- supported tasks
- tags
- risk level
- data classification
- status and deployment state

Conversational discovery may use an LLM to interpret a user's stated need and recommend registered capabilities.

For example:

```text
User:
"I need to summarize maintenance reports and identify recurring equipment issues."

        |
        v
Conversational discovery
        |
        +-- capability matching
        +-- access eligibility
        +-- risk/policy filtering
        |
        v
Candidate Agents
        |
        v
Agent cards / comparison
```

The conversational discovery model may suggest candidates, but it must not grant access or bypass authorization. Candidate visibility and recommendations must respect the user's tenant, identity, permissions, data classification, and marketplace visibility policies.

### Agent registration

Only registered and governed capabilities may be published to the marketplace.

Registration should establish, as applicable:

- Agent identity
- owner
- business unit
- description
- version
- lifecycle status
- risk classification
- data classification
- supported capabilities/tasks
- allowed tools
- allowed models/capabilities
- applicable policies
- evaluation status
- deployment status
- access requirements

Marketplace publication is therefore downstream of the Agent registration and governance lifecycle rather than a free-form publishing action.

### Agent card

An Agent card should include at least:

- **name**
- **description**
- owner
- business unit
- version
- status
- supported capabilities/tasks
- risk level
- data classification
- allowed tools/capabilities
- allowed model/capability constraints where useful
- evaluation status and relevant scores
- historical/estimated cost information where useful
- configured maximum cost/request where applicable
- deployment status
- access requirements

The **description** is a first-class usability artifact. It should explain what the Agent does, what problems it solves, and relevant boundaries/limitations so users can determine whether it matches their need.

The card must not imply a guaranteed fixed cost/request. Where cost is displayed, it should be clearly labeled as historical, estimated, average, range, or maximum configured cost as applicable.

### Access lifecycle

```text
Register
   -> govern
   -> evaluate
   -> publish
   -> discover
   -> evaluate/select
   -> request access
   -> approve (when required)
   -> use through governed execution
   -> monitor
   -> audit
```

Access decisions remain governed by the platform's identity, RBAC, policy, data-access, and approval mechanisms. Marketplace visibility does not imply execution authorization.

### Version awareness

Marketplace records are version-aware. A published Agent version must be associated with the relevant governed artifact/version state, including where applicable policies, tools, models/configuration, knowledge configuration, and evaluation status.

A new Agent version may require re-evaluation, re-approval, or republishing depending on the applicable governance policy. Historical marketplace/execution records must remain attributable to the version that was actually used.

### Marketplace and governance

The Marketplace consumes governance metadata rather than defining independent authorization rules. Shared policy and authorization services remain the source of applicable policy decisions.

The Marketplace must not expose capabilities or metadata beyond what the requesting identity is permitted to discover. Sensitive Agent metadata may require restricted visibility even when the Agent itself is published.

### Conversational discovery governance

The conversational discovery capability is itself an AI workflow and therefore follows the same platform controls as other AI capabilities, including:

- authentication and authorization
- policy enforcement
- observability and causal tracing
- evaluation
- model routing constraints
- cost controls
- prompt-injection and untrusted-content protections

The discovery model produces recommendations, not authorization decisions.

### Cost and FinOps integration

Marketplace economics are supplied by the FinOps capabilities and may include:

- historical cost
- estimated cost range
- average cost over a defined population
- cost trends
- configured maximum cost/request
- applicable budget constraints

The Marketplace must not promise a static cost/request when actual execution cost is dynamic.

### Evaluation and trust signals

Marketplace users should be able to see appropriate trust signals, subject to permissions, such as:

- evaluation status
- relevant evaluation scores
- last evaluation date/version
- risk classification
- data classification
- owner
- lifecycle status

These signals inform discovery and selection but do not replace authorization or operational policy enforcement.

## Consequences

- Users can discover capabilities without already knowing Agent names.
- Conversational discovery makes the marketplace useful for users who know their business problem but not the platform's Agent catalog.
- Marketplace recommendations remain separate from authorization and execution.
- Agent descriptions become an important usability and governance artifact.
- Marketplace records connect discovery to versioning, evaluation, governance, and FinOps.
- Access remains governed rather than being implied by catalog visibility.
- The marketplace can support enterprise-wide AI adoption without becoming an alternative execution path.
