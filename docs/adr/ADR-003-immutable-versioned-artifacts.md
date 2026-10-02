# ADR-003: Immutable Versioned Artifacts and Automated Dependency Graph

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

AI Nexus depends on many artifacts whose behavior affects production execution: agents, tools, models, prompts, policies, knowledge documents, evaluation suites, and platform components. Historical reproducibility requires the exact versions used by an execution to remain identifiable.

Stage 3 planning also established that dependency relationships must not rely on developers manually maintaining a dependency graph. Changes should be detected before release, ideally at commit/test/CI or PR-level gates. Agent artifacts use the convention `<agent-name>.artifact.ts` to make repository change detection simpler.

The dependency graph is itself part of the platform's release-safety mechanism. A repository change can alter an artifact even when a developer has not manually changed a separate dependency declaration. The system therefore needs automated change detection and dependency recomputation.

## Decision

Important AI Nexus artifacts will be **immutable and versioned**. A change to an artifact creates a new artifact version rather than mutating an already-published version.

Consumers reference explicit artifact versions. Versioned consumers also retain the versions of their versioned dependencies, producing a reproducible dependency set for each releasable artifact.

The dependency graph will be **derived automatically**, not maintained manually by developers.

### Repository change detection

The initial implementation will use deterministic repository scanning. Agent artifacts will use the convention:

```text
<agent-name>.artifact.ts
```

The Dependency Analyzer will scan files matching the artifact convention and inspect their version/dependency declarations. The implementation should also detect changes to relevant artifact metadata/configuration files rather than assuming that developers will update a separate graph file.

The analyzer will identify changed artifact files and recompute their declared dependencies during PR/CI validation. The architecture must leave room for additional artifact types and declarative metadata later.

Where practical, repository tooling may also expose an earlier local hook/test-stage check, but the authoritative enforcement boundary is CI at pull-request level before merge toward a deployed environment.

### Version-change detection

The platform should detect cases where repository content belonging to a versioned artifact changes without an appropriate version change. The exact versioning rule (for example, semantic-version rules or another policy) will be defined in the implementation specification.

A future implementation may use a repository listener/file watcher to detect changes to versioned artifact declarations during development, but such a listener is an optimization. The PR/CI analyzer remains the required safety net.

### Enforcement points

Dependency analysis should be available before deployment and may run at multiple stages:

- local developer hooks where useful
- automated tests/validation
- pull-request CI
- pre-release/release gates

The PR-level gate is the important minimum boundary: dependency inconsistencies must be caught before merging toward a deployed environment.

## Dependency graph requirements

The graph must represent at least:

- artifact identity
- artifact version
- dependency identity
- dependency version/range where applicable
- relationship type
- consumer ownership
- lifecycle status
- source/repository location where applicable

The graph must support **version-to-version dependency relationships**, not only artifact-to-artifact relationships.

Example:

```text
maintenance-agent@4.2.0
  ├── model-policy@3.0.0
  ├── tool-policy@5.1.0
  ├── rag-policy@2.0.0
  └── diagnostics-tool@1.4.0
```

A change to an artifact must allow the analyzer to determine impacted consumers and whether re-evaluation, approval, or version updates are required. This includes transitive impact where a dependency changes beneath another versioned consumer.

### Source of truth

The dependency graph is a **derived artifact**. The source of truth remains the versioned artifact metadata and dependency declarations from which the graph can be recomputed. No manually maintained graph file is required for correctness.

## Consequences

- Executions remain explainable after newer versions are released.
- Rollback can target a known artifact version and its dependency set.
- Release gates can reason about direct and transitive dependencies.
- Developers do not need to remember to manually update a separate dependency graph.
- CI becomes an architectural enforcement mechanism rather than merely a build/test runner.
- The exact dependency graph implementation may evolve without changing the architectural principle that it must be automatically derivable.
