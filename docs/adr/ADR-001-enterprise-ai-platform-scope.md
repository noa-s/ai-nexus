# ADR-001: Enterprise AI Platform Scope and Boundary

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identified enterprise AI platform architecture as a core interview requirement and identified gaps to deepen in governance, security, evaluation, observability, FinOps, PostgreSQL/pgvector, RAG, and Microsoft ecosystem integration. Stage 2 positions AI Nexus as evidence of how to build an internal AI platform for an entire enterprise rather than a single AI application.

The target is therefore not a generic chatbot or isolated RAG demo. The platform must demonstrate reusable, governed AI capabilities for multiple builders, business users, and organizational functions.

## Decision

AI Nexus will be designed as an **enterprise AI platform** whose purpose is to allow an organization to register, govern, discover, evaluate, execute, monitor, and financially manage AI agents and LLM-powered applications.

The platform boundary includes:

- AI request ingress and enterprise integrations
- identity, authorization, and policy enforcement
- agent and artifact lifecycle management
- LLM gateway and model routing
- agent runtime and tool/MCP execution
- governed RAG and enterprise knowledge
- evaluation and release gates
- observability and auditability
- AI FinOps and business-value measurement
- internal AI Marketplace and discovery
- Microsoft ecosystem integration

AI Nexus is a **platform**, not the system of record for every enterprise business process. Business systems remain external systems accessed through governed integrations/tools.

## Rationale

This scope directly supports the Principal-level story established in Stage 2: build the platform, standards, governance, and enablement layer that allows many teams to create value with AI safely and consistently.

## Consequences

- Architecture must support multiple personas and organizational entities.
- Platform capabilities must be reusable rather than embedded in individual agents.
- Governance, security, reliability, observability, and cost management are first-class concerns.
- v1 must be intentionally smaller than the eventual enterprise platform while preserving enterprise-scale boundaries.
- Every major capability must be explainable as an Ormat-relevant platform responsibility rather than portfolio complexity for its own sake.

## Out of scope for this decision

- Building every possible enterprise connector.
- Replacing Microsoft 365, Copilot Studio, Power Platform, ERP, CRM, or other systems of record.
- Implementing every future microservice as an independently deployed service in v1.
