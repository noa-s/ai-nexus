# ADR-018: Production-Like Deployment and Infrastructure as Code

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies Terraform/IaC, Docker, CI/CD, observability, security, reliability, and Azure/Microsoft ecosystem familiarity as areas to demonstrate. AI Nexus is the portfolio project selected for production-like hosting because its architecture is intentionally aligned with the role requirements.

The project should demonstrate operational thinking without requiring every planned enterprise service to be deployed independently.

## Decision

AI Nexus will have a production-like deployment architecture with:

- containerized services
- CI/CD through GitHub Actions
- reproducible infrastructure using Terraform/IaC where appropriate
- PostgreSQL + pgvector
- centralized observability
- environment separation
- secure secret injection
- health/readiness controls
- rollback/version-aware deployment strategy

The deployment topology may initially group multiple logical services while preserving the service boundaries defined by ADR-004.

At least one Microsoft ecosystem integration will be demonstrated in a production-like environment as required by ADR-016.

## Environment strategy

The architecture will distinguish local development, PR/CI validation, staging/demo, and production-like deployment concerns. Secrets will not be committed to the repository.

## Consequences

- The portfolio demonstrates deployment and operational maturity, not only application code.
- Terraform and CI/CD become executable architecture documentation.
- The deployment model can evolve toward independently deployed microservices without redesigning the logical architecture.
- Production credentials and sensitive configuration must use appropriate external secret management rather than source-controlled configuration.
