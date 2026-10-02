# AI Nexus Applications

This directory contains deployable application/runtime boundaries for the AI Nexus platform.

## Current applications

- `api-edge/` — Node.js/TypeScript API Edge boundary. It is the external application entry boundary for the platform foundation and exposes the initial health endpoint.

## Boundary rules

- Application directories represent independently owned runtime boundaries.
- Keep application-specific source, tests, configuration, and container definitions within the application boundary unless a dependency is intentionally shared.
- Shared contracts belong under `packages/contracts/` rather than being duplicated between applications.
- Architectural placement must follow the accepted ADRs and the current v1 requirements specification.

## Adding an application

Before adding a new application, identify its responsibility, owning domain, runtime, dependencies, deployment boundary, and relevant ADR/specification requirements. Do not create application directories merely as organizational folders for code that belongs to an existing boundary.
