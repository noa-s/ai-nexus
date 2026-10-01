# ADR-013: Distributed AI Observability and Causal Tracing

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

An AI request may involve multiple model calls, retrieval operations, policy checks, tool proposals, approvals, and tool executions. A single request-level trace is insufficient if it cannot explain the individual actions that produced the result.

Stage 1 explicitly requires traces across API, gateway, model calls, agents, tools, database, and retrieval.

## Decision

AI Nexus will use distributed tracing with a **root trace per AI request** and nested spans/events for material actions.

Example:

```text
Trace: request-123
|
+- ingress
+- identity/authentication
+- authorization gate
+- agent resolution
+- planning
+- llm.call #1
+- rag.query
|   +- authorization filter
|   +- vector search
|   +- reranking
+- tool.proposal
+- tool.authorization
+- approval.request
+- approval.result
+- tool.execution
+- llm.call #2
+- response.validation
+- response
```

Each material action should carry correlation identifiers and relevant artifact/policy versions.

### What is traced?

At minimum:

- inbound request
- identity/tenant context references
- authorization/policy decisions
- agent resolution
- planner/orchestrator steps
- every LLM invocation
- model/provider selection
- token usage metadata
- RAG operations
- retrieved-source references/provenance
- tool selection/proposals
- tool authorization decisions
- approvals
- tool/MCP executions and outcomes
- errors/retries/timeouts
- final response validation

Security events must link back to the causal execution trace.

## Consequences

- Operators can investigate not only what happened but the sequence that caused it.
- Tool abuse attempts can be investigated with the preceding model/runtime context.
- FinOps can attribute usage to requests, agents, teams, and workflows.
- Trace volume and sensitive-data handling require explicit sampling/redaction policies.
