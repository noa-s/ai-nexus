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

An evaluation execution is represented as a first-class **Evaluation Run**. The run records the exact versions of the evaluated artifacts and their relevant dependencies, including where applicable:

- Agent artifact/version
- model/provider configuration
- prompt/configuration versions
- tool versions
- RAG/knowledge configuration
- policy versions
- evaluation suite/version
- evaluation dataset/version
- evaluator/version/configuration

This makes an evaluation reproducible and allows the platform to explain why results changed between runs.

### Evaluation datasets

Evaluation datasets are themselves versioned artifacts. A dataset version may contain test inputs, expected/reference outcomes, reference evidence, expected tool behavior, expected policy behavior, and evaluation metadata.

A comparison between evaluation runs must preserve the dataset/suite versions so a score change is not incorrectly attributed to the Agent when the evaluation population also changed.

### Metric classes

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

Evaluation methods should be selected according to the metric:

**Deterministic metrics** — use direct measurements where possible, such as latency, token usage, cost, schema validity, tool success/failure, policy violations, or known retrieval measurements.

**Reference-based metrics** — compare a result with reference answers, evidence, expected tool behavior, or other ground truth where available.

**Evaluator/model-based metrics** — use an evaluator or LLM-as-judge when the property requires semantic or qualitative assessment and cannot be measured reliably with deterministic rules.

**Human evaluation** — use sampled review, high-risk/ambiguous cases, and evaluator calibration rather than requiring humans to manually review every response.

The platform should prefer deterministic measurement when it is sufficient and use LLM-as-judge only where its semantic judgment provides material value.

### Groundedness

Groundedness can be evaluated before deployment when test cases include reference evidence or retrieved context.

The candidate response can be passed to a claim-extraction evaluator that derives evaluable claims. Those claims are then checked against the supplied reference/retrieved evidence by a separate evaluator. The model being evaluated does not authorize or self-certify its own groundedness.

For example:

```text
Candidate response
      |
      v
Claim extraction evaluator
      |
      +-- Claim A
      +-- Claim B
      +-- Claim C
             |
             v
Evidence/support evaluator
             |
             v
supported / unsupported
```

Human review may be used to calibrate the evaluator and validate sampled production cases, but it is not the sole measurement mechanism.

### Metric definitions and scoring contracts

Every production evaluation metric must have a documented metric definition containing, as applicable:

- metric name and semantic meaning
- measurement formula
- scale/range
- directionality (higher/lower is better)
- minimum sample requirements
- confidence/statistical requirements where relevant
- thresholds
- weighting if combined into a composite score
- pass/fail or alert rules
- evaluation method
- evaluator version where applicable

The implementation specification will define the concrete formulas and thresholds for the v1 metrics.

### Evaluation results

An Evaluation Result records more than a final score. It should retain, as applicable:

- metric identifier/version
- score
- raw measurements
- sample count
- confidence/statistical information
- Evaluation Run identifier
- evaluator/version/configuration
- dataset/suite versions
- evaluated artifact/dependency versions
- policy versions
- timestamp
- pass/fail decision where applicable

This allows the platform to reproduce and investigate material evaluation results.

### Production evaluation

Production traces, sampled responses, tool outcomes, user feedback, incidents, and other outcome signals can feed post-deployment evaluation. Production evaluation is used for regression, drift, and quality monitoring rather than as a substitute for pre-production gates.

Production signals may create new evaluation cases or trigger re-evaluation, but a noisy single production observation should not automatically become a deployment-blocking decision without a defined release policy.

## Token/cost measurement

Token usage is collected from the LLM Gateway/provider adapter. Providers commonly return usage metadata with responses; where exact provider usage is unavailable, AI Nexus may estimate usage using the provider's tokenizer/model metadata and must label the value as estimated rather than exact.

The Evaluation service consumes this execution telemetry rather than attempting to infer token usage independently.

## Evaluation and release gates

Pre-production evaluation can participate in release gates. A release policy may require specified metrics to meet their thresholds before an artifact can be promoted.

Production evaluation is primarily a monitoring, regression, drift, and feedback mechanism unless a separately defined governance policy makes a specific production signal a release or operational gate.

## Consequences

- Releases can be blocked on measurable quality/safety criteria.
- Evaluation results are reproducible against versioned artifacts, datasets, suites, and evaluators.
- Metric scores have explicit measurement contracts rather than being arbitrary dashboard numbers.
- Deterministic measurements are preferred where they are sufficient.
- Production telemetry can improve future evaluation suites.
- No single metric is treated as a universal measure of agent quality.
