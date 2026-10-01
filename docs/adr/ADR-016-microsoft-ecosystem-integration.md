# ADR-016: Microsoft Ecosystem Integration and Copilot Studio Gateway Boundary

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies Azure/Microsoft ecosystem familiarity as a relative gap and specifically calls out Microsoft 365, Copilot Studio, Power Platform, and enterprise identity/integration patterns. The interview preparation also identifies Microsoft ecosystem integration as an explicit part of the role.

AI Nexus should therefore demonstrate at least one real Microsoft ecosystem integration rather than only documenting a conceptual mapping.

A key enterprise requirement is organization-wide enforcement: if employees use Copilot Studio to access governed AI capabilities, the architecture should provide a controlled integration boundary rather than relying on individual users to voluntarily route requests through AI Nexus.

## Decision

### v1 Microsoft integration target

AI Nexus will use **Copilot Studio as the primary Microsoft ecosystem integration for v1**. The production-like demonstration will use an authenticated Copilot Studio integration path, initially targeting a **custom connector to the AI Nexus integration API** because it provides a concrete enterprise-facing demonstration without coupling the AI Nexus runtime to Microsoft-specific internals.

Microsoft 365 Copilot/API or MCP plugin integration remains a future integration path. It is not required for the v1 demonstration.

The integration boundary will normalize identity/request context and route applicable requests into AI Nexus governance and execution paths.

Conceptually:

```text
Employee
   |
   v
Copilot Studio
   |
   | authenticated connector
   v
AI Nexus API / Edge Boundary
   |
   v
Governance / Authorization
   |
   v
Agent Runtime
   |
   +--> Model Router --> LLM Provider
   +--> RAG Runtime
   +--> Tool / MCP Runtime
```

The Microsoft integration is an external-client adapter/boundary, not an alternative AI Nexus execution runtime.

### Identity and authorization

Microsoft authentication and AI Nexus authorization are separate concerns.

The integration must preserve the applicable Microsoft identity/tenant context so AI Nexus can make its own authorization and policy decisions. AI Nexus must not interpret successful Microsoft authentication as permission to perform an AI Nexus action.

Where delegated user identity is required, the selected Microsoft authentication mechanism must preserve an appropriate user/application identity context for the AI Nexus authorization boundary.

### AI Nexus interface boundary

Copilot Studio must enter AI Nexus through a supported external integration/API contract. It must not connect directly to internal Agent Runtime, Tool Runtime, RAG Runtime, LLM Gateway, or other internal service endpoints.

The integration endpoint is part of the AI Nexus external API/edge boundary established by the observability architecture. It is not a separate business service whose responsibility is to duplicate governance logic.

### Model routing

The Microsoft client does not select or bypass the AI Nexus model-routing policy. Once a request enters AI Nexus, applicable model selection remains under the AI Nexus Model Router and its governance constraints.

This preserves provider abstraction, quality/capability constraints, cost controls, fallback behavior, and centralized observability.

### Observability

Microsoft-originated requests must participate in the same AI Nexus causal-tracing model as requests from other external clients.

For example:

```text
Trace T123
|
+- microsoft.copilot.entry
+- authentication / identity.context
+- request.validation
+- authorization.decision
+- agent.resolution
+- model.route
+- llm.call
+- rag.query
+- tool.proposal
+- tool.authorization.decision
+- tool.execution
+- response
```

The trace must preserve the applicable user/tenant references and artifact/policy versions subject to the platform's security and data-classification policies.

### Organization-wide enforcement

AI Nexus must not claim that Copilot Studio traffic is governed merely because an endpoint exists.

Organization-wide enforcement has three distinct levels:

1. **Integration** — Copilot Studio can call the AI Nexus governed endpoint.
2. **Governance** — requests reaching AI Nexus are authenticated, authorized, policy-evaluated, traced, and subject to execution controls.
3. **Organization-wide enforcement** — the organization establishes Microsoft tenant/platform controls and other applicable controls so the governed AI use case cannot simply bypass AI Nexus through an alternate path.

AI Nexus can enforce the second level for requests it receives. The third level cannot be guaranteed by an AI Nexus application endpoint alone because Microsoft tenant/platform administration and organizational controls are outside the application boundary.

The implementation/design must therefore investigate and document controls such as:

- approved connector/API configuration
- tenant/application identity
- Microsoft administrative policies and configuration
- access policies
- network/API gateway controls where applicable
- approved agent/tool configuration
- monitoring for bypass paths

The final implementation specification must clearly distinguish what is technically enforced by AI Nexus from what requires Microsoft tenant or organizational administration.

### Production-like demonstration

At least one non-custom Microsoft ecosystem integration will be implemented as a production-like demonstration, with Copilot Studio as the v1 target. Credentials/tokens/secrets will be stored outside source control using the project's approved secret-management mechanism.

## Consequences

- AI Nexus demonstrates real Microsoft ecosystem integration rather than only architecture diagrams.
- Copilot Studio is treated as an external enterprise consumer of AI Nexus.
- Identity and authorization context must be preserved across the integration boundary.
- Internal AI Nexus services remain protected behind the external API/edge boundary.
- Model selection remains centralized in AI Nexus rather than being controlled by the Microsoft client.
- Microsoft-originated requests participate in the same observability, governance, and security model as other AI Nexus requests.
- Organization-wide enforcement becomes a first-class architecture and investigation item rather than an unsupported claim.
- The final implementation specification must document exactly what is enforced technically and what remains a Microsoft tenant/organizational configuration responsibility.
