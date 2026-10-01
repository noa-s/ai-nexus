# ADR-013: Distributed AI Observability and Causal Tracing

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

An AI request may involve multiple model calls, retrieval operations, policy checks, tool proposals, approvals, and tool executions. A single request-level trace is insufficient if it cannot explain the individual actions that produced the result.

Stage 1 explicitly requires traces across API, gateway, model calls, agents, tools, database, and retrieval.

AI Nexus has an external **API / Edge Boundary** where requests enter the platform. This is an entry boundary, not a separate AI Nexus business service called an "Ingress Service". Its concrete deployment implementation (for example an enterprise API gateway, API Management layer, application gateway, or Kubernetes ingress) is a deployment decision.

## Decision

AI Nexus will use distributed tracing with a **root trace per AI request** and nested spans, events, and material decisions for the execution lifecycle.

The API / Edge Boundary establishes or propagates the distributed trace context. The same trace context must propagate across service boundaries so a request remains causally connected when execution crosses the Agent Runtime, LLM Gateway, RAG Runtime, Tool/MCP Runtime, and external integrations.

Example:

```text
Trace: request-123
|
+- api.entry
+- authentication
+- request.validation
+- authorization.decision
+- agent.resolution
+- planning
+- llm.call #1
+- rag.query
|   +- authorization.filter
|   +- vector.search
|   +- reranking
+- tool.proposal
+- tool.authorization.decision
+- approval.request
+- approval.result
+- tool.execution
|   +- external.integration.call
+- llm.call #2
+- response.validation
+- response
```

### Trace, span, event, and decision

These concepts have distinct roles:

- **Trace** — the complete causal execution of an AI request.
- **Span** — a timed operation within the trace, such as an LLM call, RAG query, or tool execution.
- **Event** — a material occurrence associated with an operation, such as a retry, prompt-injection detection, approval request, or security event.
- **Decision** — a material platform decision, such as an authorization result, model route, approval requirement, or policy decision.

Material spans, events, and decisions must preserve their causal parentage so an investigator can traverse from an outcome back through the actions and decisions that caused it.

### Causal relationships

For example:

```text
Trace T123
|
+- Agent execution A1
|   |
|   +- LLM call L1
|       |
|       +- tool proposal P1
|
+- Tool authorization decision D1
|
+- Tool execution X1
    |
    +- external API call
```

This allows AI Nexus to answer questions such as why a particular tool action occurred, which model call proposed it, which policy decision allowed or denied it, and which external operation resulted from the decision.

### What is traced?

At minimum:

- API/edge entry
- request/correlation context
- identity/tenant context references
- authorization and policy decisions
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
- external integration calls where observable
- errors/retries/timeouts
- final response validation

Each material action should carry correlation identifiers and relevant artifact/policy versions.

### Policy decision traceability

A material policy decision should record sufficient metadata to reconstruct the decision without requiring the raw policy text to be copied into every trace event, including where applicable:

- policy identifier
- policy version
- subject/workload reference
- requested action
- target/resource reference
- decision (allow/deny/approval-required)
- reason code
- relevant evaluation context references

This allows investigators to determine which exact policy version governed an action.

### Tool-abuse causal tracing

If an Agent proposes a forbidden action, the trace must preserve the causal sequence rather than recording only the final denial.

```text
User request
   |
Agent resolution
   |
RAG retrieval
   |   +- potentially injected instruction
   |
LLM call
   |
tool proposal: email.send
   |
tool authorization decision: DENY
   |
security event: forbidden_tool_action
   |
response
```

The security event must link to the parent execution trace and preserve the relevant Agent/model/runtime context needed for investigation, subject to data-classification and redaction policies.

### Data protection in observability

Observability metadata is not automatically entitled to the underlying business data. Prompts, retrieved content, tool arguments, model responses, and identifiers may contain confidential or personal information.

Trace storage must therefore support policy-controlled handling such as:

- full payload where permitted
- redacted payload
- metadata only
- hash/reference only

Retention, access, and redaction rules are governed by applicable policies and data classification.

### Artifact and dependency context

Traces should capture the versions of material artifacts that influenced an execution, including where applicable:

- Agent artifact/version
- model/provider configuration
- prompt/configuration version
- policy versions
- tool versions
- knowledge/document version references
- relevant runtime/configuration versions

This connects execution history with the version/dependency graph and supports reproducibility, incident investigation, and impact analysis.

### Observability as a platform data source

Execution telemetry is consumed by multiple platform capabilities:

```text
                    Execution Trace
                          |
             +------------+------------+
             |            |            |
             v            v            v
         Evaluation     FinOps      Security
             |            |            |
          quality        cost       incidents
          metrics        usage      violations
```

Observability therefore provides platform telemetry rather than being limited to operational dashboards.

### Correlation identifiers

The architecture should distinguish, as applicable:

- `trace_id` — distributed causal execution
- `span_id` — individual operation
- `parent_span_id` — causal parent
- `request_id` — external request identity
- `agent_execution_id` — Agent execution identity
- actor/tenant references — identity context without unnecessarily duplicating sensitive identity data

### Auditor consumption

The raw causal trace is machine-oriented. A future Auditor capability/Agent may consume traces and produce human-readable explanations, investigations, compliance summaries, or trend insights.

The core observability layer remains responsible for collecting and preserving the evidence; it does not need to interpret every trace into a human narrative.

## Consequences

- Operators can investigate not only what happened but the sequence that caused it.
- Distributed execution remains causally connected across future microservice boundaries.
- Tool abuse attempts can be investigated with the preceding model/runtime context.
- Policy decisions can be reconstructed against exact policy versions.
- FinOps, Evaluation, and Security can consume the same execution telemetry.
- Sensitive trace content is subject to classification, redaction, access, and retention policies.
- Trace volume requires explicit sampling and retention strategies.
- The API/Edge Boundary is an entry boundary, not an additional AI Nexus business service.
