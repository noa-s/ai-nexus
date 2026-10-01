# ADR-007: Central LLM Gateway and Policy-Driven Model Routing

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus must abstract applications and agents from individual model providers while supporting routing, fallback, quotas, rate limits, cost controls, observability, and policy enforcement. Stage 1 identifies provider abstraction and model routing as major platform requirements.

Routing decisions cannot be based on a static claim that one model is always better. They depend on request/task characteristics and platform constraints.

## Decision

All governed LLM calls will enter a central **LLM Gateway**. The gateway exposes a stable internal AI invocation contract and delegates provider-specific behavior to adapters.

The **Model Router** is a logical capability of the gateway and may be invoked for every model decision point, including model calls that occur during an agent flow. A tool is not inherently restricted to exactly one model/provider; if a tool internally needs an LLM, that invocation must use the governed gateway path as well.

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

The gateway records provider/model selection, token usage where the provider exposes it, latency, errors, policy decisions, and cost inputs needed for FinOps and observability.

## Consequences

- Applications do not hard-code provider integrations.
- Model changes and fallback strategies can be governed centrally.
- Model routing can optimize quality, latency, availability, and cost without coupling agents to a single provider.
- All LLM calls become observable and attributable.
- The gateway becomes a critical platform boundary and must be designed for reliability, security, and scale.
