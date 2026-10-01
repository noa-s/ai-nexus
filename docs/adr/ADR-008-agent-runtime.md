# ADR-008: Explicit Agent Runtime Separation and Governed Execution

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Agent execution combines planning, context, retrieval, model interaction, tool selection/execution, approvals, and response validation. Treating these as one opaque agent function makes authorization, tracing, testing, and failure handling difficult.

The runtime must also distinguish platform metadata from live request inputs and preserve a causal trace of each action.

## Decision

The Agent Runtime will explicitly separate the following logical stages:

1. **Request/context initialization** — identity, tenant, roles, request metadata, constraints, and trace context.
2. **Agent resolution** — resolve the authorized agent/artifact version and its configuration/policy dependencies.
3. **Planning/orchestration** — determine the next actions needed for the request.
4. **Model interaction** — invoke the LLM Gateway/Model Router for each governed LLM call.
5. **RAG coordination** — apply retrieval policy, authorization filtering, query transformation, retrieval, reranking where applicable, provenance, and context assembly.
6. **Tool coordination** — identify proposed tool actions and pass them through tool authorization/policy evaluation before execution.
7. **Approval handling** — pause for human/system approval when required by policy.
8. **Tool/MCP execution** — execute only authorized actions and capture results.
9. **Response validation** — apply output/safety/grounding/format validation before returning the result.

### Inputs to the separated stages

The runtime uses a combination of:

- live request/user context
- resolved agent artifact/version
- immutable policy versions referenced by the artifact
- model/tool/knowledge registry metadata
- retrieved knowledge context
- previous step outputs
- runtime telemetry and budget/quota state

The exact contract for each stage will be defined in the implementation specification.

## Tool/model relationship

A tool does not have to use exactly one model. Tool execution itself is not a model-selection mechanism. Whenever an LLM is needed to prepare, interpret, validate, or otherwise support a tool operation, that model invocation uses the same governed LLM Gateway/Model Router.

## Consequences

- Each action can receive its own authorization and policy decision.
- The runtime can produce a causal trace from request through model, RAG, approval, and tool actions.
- Individual stages can later become independently deployed services.
- Failures and retries can be bounded per stage.
- The architecture is more testable than a monolithic agent loop.
