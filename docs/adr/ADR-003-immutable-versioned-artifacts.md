# ADR-003: Immutable Versioned Artifacts and Automated Dependency Graph

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus depends on many artifacts whose behavior affects production execution: agents, tools, models, prompts, policies, knowledge documents, evaluation suites, and platform components. Historical reproducibility requires the exact versions used by an execution to remain identifiable.

Stage 3 planning also established that dependency relationships must not rely on developers manually maintaining a dependency graph. Changes should be detected before release, ideally at commit/test/CI or PR-level gates. Agent artifacts use the convention `<agent-name>.artifact.ts` to make repository change detection simpler.

## Decision

Important AI Nexus artifacts will be **immutable and versioned**. A change creates a new artifact version rather than mutating an existing version.

Consumers reference explicit versions. The platform will retain dependency relationships between versioned artifacts.

The dependency graph will be **derived automatically**, not maintained manually by developers.

### Repository change detection

The initial implementation will use deterministic repository scanning, including detection of files matching:

```text
<agent-name>.artifact.ts
```

The analyzer will identify changed artifact files and recompute their declared dependencies during PR/CI validation. The architecture must leave room for additional artifact types and declarative metadata later.

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

Example:

```text
maintenance-agent@4.2.0
  ├── model-policy@3.0.0
  ├── tool-policy@5.1.0
  ├── rag-policy@2.0.0
  └── diagnostics-tool@1.4.0
```

A change to an artifact must allow the analyzer to determine impacted consumers and whether re-evaluation, approval, or version updates are required.

## Consequences

- Executions remain explainable after newer versions are released.
- Rollback can target a known artifact version.
- Release gates can reason about transitive dependencies.
- Developers do not need to remember to manually update a separate dependency graph.
- CI becomes an architectural enforcement mechanism rather than merely a build/test runner.
- The exact dependency graph implementation may evolve; the source of truth should remain derivable from repository/artifact metadata.
