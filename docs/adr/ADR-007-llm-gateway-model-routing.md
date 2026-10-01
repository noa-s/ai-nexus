# ADR-007: Central LLM Gateway and Policy-Driven Model Routing

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus must abstract applications and agents from individual model providers while supporting routing, fallback, quotas, rate limits, cost controls, observability, and policy enforcement. Stage 1 identifies provider abstraction and model routing as major platform requirements.

Routing decisions cannot be based on a static claim that one model is always better. They depend on request/task characteristics and platform constraints.

## Decision

All governed LLM calls will enter a central **LLM Gateway**. The gateway exposes a stable internal AI invocation contract and delegates provider-specific behavior to adapters.

The **Model Router** is a logical capability of the gateway and may be invoked for every model decision point, including model calls that occur during an agent flow. A tool is not inherently restricted to exactly one model/provider; if a tool internally needs an LLM, that invocation must use the governed gateway path as well.

### Routing inputs and their sources

Routing inputs will be derived from available request/runtime context and platform metadata, including:

- task/request classification
- requested quality level
- latency requirement
- cost budget/constraint
- data sensitivity/classification
- model/provider availability
- applicable model policy
- agent/tool context
- evaluation/quality information
- tenant or business-unit constraints where applicable

These inputs come from the request context, registered artifact metadata, policy registry, model registry/provider metadata, usage/budget state, and runtime telemetry. The detailed schema and source-of-truth for each routing input will be defined in the implementation specification.

### Constrained routing

Routing is a **constrained optimization problem**, not simply a model ranking exercise.

First, hard constraints eliminate models that are not eligible. Examples include:

- data-classification restrictions
- model/provider policy restrictions
- required capability or modality not supported
- tenant or organizational restrictions
- unavailable provider/model
- budget or quota constraints
- regional or residency constraints where applicable

Only eligible candidates proceed to optimization/ranking. Soft criteria may then include:

- evaluated quality
- task suitability
- latency
- cost
- availability/reliability
- other configured optimization objectives

The resulting flow is:

```text
Request/runtime context
        |
        v
Normalize routing context
        |
        v
Hard-constraint filtering
        |
        v
Eligible model candidates
        |
        v
Quality/cost/latency/capability ranking
        |
        v
Selected model
        |
        v
Provider adapter
```

### Model Registry

The Model Registry is the authoritative platform metadata source for model/provider capabilities used by routing. Metadata may include:

- provider and model identity
- supported capabilities/modalities
- context limits
- structured-output/tool-calling support
- data-classification approval
- region/residency availability
- cost metadata
- lifecycle/status
- evaluation results relevant to routing

The router should not maintain an unrelated duplicate catalog of model capabilities.

### Explainable routing

Every routing decision must be attributable to a trace/audit record sufficient to answer **why a model was selected or excluded**.

The record should capture, as appropriate:

- normalized routing inputs
- applicable constraints/policies
- excluded candidates and reasons
- eligible candidates
- ranking/selection outcome
- fallback decisions
- selected provider/model

The implementation should avoid exposing sensitive policy or internal scoring details to unauthorized end users while retaining sufficient information for operators/auditors.

### Fallback

Fallback is another governed routing decision, not a bypass of routing or authorization.

For example, a provider timeout may cause the router to select another eligible model. A model rejected because of a policy constraint must not be replaced with an arbitrary model that bypasses the same constraint.

### Usage and cost telemetry

The gateway records provider/model selection, latency, errors, policy decisions, and token usage where the provider exposes it.

Where available, provider usage metadata may include:

- input tokens
- output tokens
- total tokens
- cached tokens
- reasoning tokens or equivalent provider-specific usage

Unavailable provider metrics must be recorded as unavailable rather than inferred as authoritative usage. The gateway retains the usage/cost inputs needed by FinOps and observability.

## Consequences

- Applications do not hard-code provider integrations.
- Model changes and fallback strategies can be governed centrally.
- Model routing can optimize quality, latency, availability, and cost without coupling agents to a single provider.
- Hard governance constraints are applied before optimization so cost or quality cannot override authorization/policy requirements.
- Routing decisions are explainable and auditable.
- All LLM calls become observable and attributable.
- The gateway becomes a critical platform boundary and must be designed for reliability, security, and scale.
