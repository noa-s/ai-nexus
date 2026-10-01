# ADR-008: Explicit Agent Runtime Separation and Governed Execution

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Agent execution combines planning, context, model interaction, retrieval coordination, tool coordination, approvals, and response validation. Treating these as one opaque agent function makes authorization, tracing, testing, and failure handling difficult.

AI Nexus distinguishes the **Agent Runtime** from the downstream **LLM Gateway, RAG/Knowledge Runtime, and Tool/MCP Runtime**. The Agent Runtime orchestrates execution of an Agent; it does not become the implementation owner of those downstream capabilities.

The runtime must also distinguish platform metadata from live request inputs, preserve a causal trace of each action, and treat model-generated actions and intermediate outputs as untrusted data until they pass the applicable controls.

## Decision

The Agent Runtime will explicitly separate the following logical stages:

1. **Request/context initialization** — establish identity, tenant, roles, request metadata, applicable constraints, and trace context.
2. **Agent resolution** — resolve the authorized agent/artifact version and its configuration and immutable policy dependencies.
3. **Planning/orchestration** — determine the next actions needed for the request and coordinate calls to downstream governed runtimes.
4. **Model interaction** — invoke the LLM Gateway/Model Router for each governed LLM call.
5. **RAG coordination** — request knowledge retrieval from the RAG/Knowledge Runtime with the applicable agent/request context; the downstream runtime owns retrieval, knowledge authorization, provenance, and context assembly.
6. **Tool coordination** — identify proposed tool actions and submit them to the Tool/MCP Runtime for authorization and execution; the Agent Runtime does not directly implement tool execution.
7. **Approval handling** — pause for human/system approval when required by applicable policy and resume only after the required decision is obtained.
8. **Response validation** — apply the applicable output/safety/grounding/format validation before returning the result.

The Agent Runtime therefore owns **agent execution state and orchestration**, while downstream runtimes own their respective execution boundaries.

## Policy boundaries

An Agent is itself a governed, versioned artifact and may reference immutable policy versions. Agent policies can constrain, for example:

- permitted models/providers
- allowed tools/capabilities
- accessible knowledge scopes
- data classifications
- execution budgets/quotas
- approval requirements
- output constraints
- execution/environment restrictions

The Agent Runtime consumes and enforces the applicable Agent policy constraints during orchestration, but it does **not** own policy definitions or policy lifecycle. Policy artifacts and versions are managed through the shared Policy Registry/Governance capability.

Downstream runtimes have their own applicable policy boundaries as well. For example, the RAG/Knowledge Runtime enforces knowledge-access policies and the Tool/MCP Runtime enforces tool/action policies. A downstream runtime must independently enforce its own authorization and policy requirements rather than trusting the Agent Runtime's prior decision as sufficient.

This creates defense in depth:

```text
Policy Registry / Governance
          |
          +---- Agent policies
          +---- RAG/knowledge policies
          +---- Tool/action policies
          +---- Model/provider policies
          |
          v
     Agent Runtime
          |
     +----+---------+
     |              |
     v              v
RAG Runtime     Tool Runtime
     |              |
 knowledge       tool/action
 enforcement     enforcement
```

## Untrusted action and output boundary

LLM-generated actions are proposals, not authorization decisions.

For example:

```text
LLM proposes: "send email to X"
             |
             v
      Tool/MCP Runtime
             |
       authorization
       policy checks
       target checks
       approval rules
             |
       +-----+-----+
       |           |
      DENY       ALLOW
       |           |
       v           v
  alert/audit   execute
```

Likewise, previous model outputs, retrieved content, tool results, and intermediate step outputs must retain appropriate provenance/trust information. Being produced by an earlier stage does not automatically make the data trusted or authorized for the next action.

## Inputs to the separated stages

The runtime uses a combination of:

- live request/user context
- resolved agent artifact/version
- immutable Agent policy versions and other applicable policy references
- model/tool/knowledge registry metadata
- downstream runtime results and provenance
- previous step outputs with their trust/provenance context
- runtime telemetry and budget/quota state
- approval decisions where applicable

The detailed contract for each stage, including which inputs are authoritative and which are untrusted, will be defined in the implementation specification.

## Tool/model relationship

A tool does not have to use exactly one model. Tool execution itself is not a model-selection mechanism. Whenever an LLM is needed to prepare, interpret, validate, or otherwise support a tool operation, that model invocation uses the same governed LLM Gateway/Model Router.

## Causal execution trace

An Agent request produces a hierarchical trace rather than a single opaque record. The trace should represent the causal sequence and parent/child relationship of meaningful actions, such as:

```text
Agent request
 |
 +-- Agent resolution
 +-- LLM call #1
 +-- RAG request
 |    +-- retrieval
 |    +-- authorization filtering
 |    +-- provenance/context assembly
 +-- Tool proposal
 +-- authorization decision
 +-- approval
 +-- Tool execution
 +-- LLM call #2
 +-- Response validation
```

Each action should retain sufficient context to reconstruct what happened, why it happened, and which prior action caused it, subject to security and privacy controls.

## Consequences

- Agent Runtime remains an orchestration boundary rather than becoming a monolithic implementation of RAG or tools.
- Agent-specific policies are explicitly represented without making Agent Runtime the owner of policy lifecycle.
- Downstream runtimes independently enforce their own security and governance controls.
- LLM-generated actions cannot authorize themselves.
- The runtime can produce a causal trace from request through model, RAG, approval, and tool actions.
- Individual logical boundaries can later become independently deployed services.
- Failures and retries can be bounded per stage.
- The architecture is more testable and auditable than a monolithic agent loop.
