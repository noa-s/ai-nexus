# AI Nexus Workers

This directory contains independently deployable worker/runtime boundaries for asynchronous or specialized AI Nexus execution.

## Current workers

- `ai-data-worker/` — Python 3.11 worker foundation for data-oriented/background runtime capabilities.

## Boundary rules

- Worker directories represent independently owned runtime boundaries.
- Keep worker-specific source, tests, configuration, and container definitions within the worker boundary unless a dependency is intentionally shared.
- Workers must not become an unbounded location for unrelated background logic.
- Cross-runtime communication must use explicit contracts and authenticated service-to-service communication as required by the accepted ADRs.
- Architectural placement must follow the accepted ADRs and the current v1 requirements specification.

## Adding a worker

Before adding a worker, identify its responsibility, execution model, owning domain, runtime, dependencies, deployment boundary, and relevant ADR/specification requirements. Prefer an existing worker boundary when the responsibility already belongs there.
