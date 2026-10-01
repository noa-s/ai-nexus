# ADR-012: Pre-Production and Production AI Evaluation

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies formal AI evaluation as a gap to deepen. Evaluation must support release decisions before production and detect quality/safety regressions after deployment.

Some metrics can be measured deterministically; others require reference data, evaluators, or LLM-as-judge. User feedback can be a production signal but is not the only source of evaluation data.

## Decision

AI Nexus will have two complementary evaluation modes.

### Offline / pre-production evaluation

A versioned evaluation suite contains test cases, expected/reference outcomes where available, and evaluation configuration. The Evaluation Runner executes an agent/model version against the suite.

Metrics may include:

- correctness/quality
- groundedness
- hallucination/error rate
- safety/policy compliance
- tool correctness
- retrieval quality
- latency
- reliability
- token usage/cost

Groundedness and similar metrics can be evaluated before deployment when test cases include reference evidence or when an evaluator checks generated claims against retrieved/reference context. This does not require users to manually review every claim.

For groundedness, the system may derive **generated claims** from the candidate response using a deterministic/LLM-assisted claim extraction evaluator, then test whether those claims are supported by the provided reference context. Human review may be added for calibration and sampled production validation, but is not the sole measurement mechanism.

### Production evaluation

Production traces, sampled responses, tool outcomes, user feedback, incidents, and other outcome signals can feed post-deployment evaluation. Production evaluation is used for regression, drift, and quality monitoring rather than as a substitute for pre-production gates.

### Scoring

Each metric will have a documented scoring method and normalization appropriate to its semantics. The implementation specification will define metric formulas, thresholds, weighting, confidence/sample requirements, and pass/fail rules.

Evaluation results are versioned and associated with the exact evaluated artifact versions and policy versions.

## Token/cost measurement

Token usage is collected from the LLM Gateway/provider adapter. Providers commonly return usage metadata with responses; where exact provider usage is unavailable, AI Nexus may estimate usage using the provider's tokenizer/model metadata and must label the value as estimated rather than exact.

## Consequences

- Releases can be blocked on measurable quality/safety criteria.
- Evaluation results are reproducible against versioned artifacts and datasets.
- Production telemetry can improve future evaluation suites.
- No single metric is treated as a universal measure of agent quality.
