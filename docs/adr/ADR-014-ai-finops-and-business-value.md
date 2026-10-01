# ADR-014: AI FinOps, Cost Attribution, and Business Value

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies AI FinOps as a gap to deepen. Token spend alone does not demonstrate whether enterprise AI is economically useful. AI Nexus therefore needs both financial visibility and business-value measurement.

A request's cost is dynamic because model/provider, token consumption, retries, routing, and workload characteristics vary. The platform should not represent a fixed cost/request as a guaranteed value.

## Decision

AI Nexus will collect usage and pricing inputs sufficient to calculate actual or estimated cost and attribute it across dimensions such as:

- provider
- model
- application
- agent
- workflow/request
- user
- team/business unit
- tenant

The platform will support:

- token accounting
- cost attribution
- budgets
- quotas/limits
- forecasting
- anomaly detection
- model economics
- cost/quality tradeoffs
- optimization recommendations

### Cost data flow

The LLM Gateway/provider adapter is the authoritative source for observed model usage metadata where the provider supplies it. FinOps consumes this execution telemetry rather than independently inferring token usage.

```text
LLM Provider
     |
     | usage metadata
     v
LLM Gateway
     |
     +-------------------> execution trace
     |
     v
FinOps
     |
     +---- pricing configuration
     |
     v
cost calculation / attribution
```

Pricing is configuration rather than provider usage telemetry and must be versioned. A calculated cost record should retain the pricing version used so historical costs remain reproducible when provider prices change.

### Versioned pricing

Pricing configurations are versioned artifacts. A pricing version may define, as applicable:

- input-token price
- output-token price
- cached-input price
- batch/discount pricing
- effective date/time
- provider/model applicability

Historical executions must retain the pricing version used for their cost calculation rather than being silently recalculated with a later pricing version.

### Hierarchical cost attribution

Cost is attributable through the execution hierarchy. For example:

```text
Tenant
  |
  +-- Business Unit
       |
       +-- Team
            |
            +-- Application
                 |
                 +-- Agent
                      |
                      +-- Workflow
                           |
                           +-- LLM call(s)
                           +-- RAG / embedding usage
                           +-- Tool/integration usage
```

This supports questions such as total cost by Agent, workflow, team, business unit, application, or tenant.

### AI cost versus workflow cost

AI Nexus distinguishes between:

**AI platform cost** — model/provider usage and other directly attributable AI platform costs.

**Workflow operational cost** — AI cost plus other measurable incremental execution costs such as external services or compute where those costs are available and attributable.

**Business value** — measurable or estimated outcomes such as time saved, avoided labor effort, throughput improvement, quality improvement, or avoided operational cost.

This prevents model token spend from being treated as the complete economic cost of an AI-enabled business process.

### Dynamic cost model

Agent/marketplace consumers will not be promised a fixed cost per request. Where useful, the platform may expose historical/estimated cost ranges and enforce a configured **maximum cost/request or budget constraint**.

Maximum-cost and budget constraints are policy-controlled rather than marketplace price guarantees.

### Business value

FinOps analytics will also support business justification, including where measurable:

- time saved
- labor effort reduced
- throughput/productivity improvement
- process cycle-time reduction
- automation rate
- avoided operational cost
- quality/error improvements
- value delivered versus AI spend

The implementation must distinguish measured business outcomes from observed operational signals and estimates/user-entered assumptions.

### Business-value evidence classes

Business-value measurements should be classified as:

- **Measured** — directly observed from system/process data.
- **Observed** — an operational outcome or user-reported signal that provides evidence but may require interpretation or correlation.
- **Estimated** — calculated using assumptions, rates, baselines, or other models rather than directly measured value.

The UI and reports must preserve this distinction rather than presenting estimated value as measured financial fact.

### Baselines

A business-value improvement requires a baseline or comparison point where practical. Baselines may include:

- historical process measurements
- a pre-AI measurement period
- a control/comparison group
- a documented manual-process benchmark

For example:

```text
Baseline process duration
          |
          v
AI-assisted process duration
          |
          v
measured/estimated time difference
```

### Business-value calculation

Where the necessary inputs are available, the platform may calculate outcomes such as:

```text
Time saved = baseline task duration - AI-assisted task duration

Total time saved = time saved per task * eligible task volume
```

If labor or other monetary rates are used to convert time into value, those rates and assumptions must be identified as inputs to the calculation.

ROI calculations should use a defined incremental-cost basis rather than simply dividing business value by model token spend. The implementation specification will define the exact v1 formulas.

### FinOps and Model Routing

FinOps data can provide cost signals to the Model Router. Routing decisions may consider cost, budget, and historical economics together with capability, quality, latency, availability, policy, and other routing constraints.

Cost must not become an unconditional "cheapest model wins" rule. A cheaper model that violates quality, capability, security, or policy requirements is not an acceptable route.

### Optimization recommendations

FinOps should surface actionable optimization insights, for example:

- a lower-cost model historically meeting the required quality threshold for a workload
- abnormal retry or token consumption patterns
- RAG context increasing token consumption without corresponding quality benefit
- unusual budget acceleration
- high-cost Agents or workflows
- unexpected changes in provider/model mix

Recommendations should expose the evidence and relevant assumptions rather than silently changing routing behavior.

### Cost anomaly detection

Anomaly detection may identify:

- sudden token spikes
- unexpected model usage
- retry explosions
- unusually long Agent executions
- tool loops that increase cost
- abnormal budget consumption
- unusual cost by user, team, Agent, or workflow

Some anomalies may also represent security or safety incidents and should be correlated with the execution/security trace where applicable.

## Consequences

- AI economics become attributable and explainable.
- Historical cost calculations remain reproducible against versioned pricing.
- Cost controls can protect the platform from runaway usage.
- Marketplace descriptions can avoid misleading fixed-price claims.
- Model routing can incorporate economic signals without reducing routing to price alone.
- Business stakeholders can evaluate AI in terms of outcomes rather than token spend alone.
- Business-value reporting must clearly distinguish measured outcomes from observations and estimates.
