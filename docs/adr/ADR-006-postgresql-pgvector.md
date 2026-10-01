# ADR-006: PostgreSQL + pgvector as the Platform Data Foundation

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

Stage 1 identifies PostgreSQL and pgvector as important hands-on gaps to close. AI Nexus needs transactional platform state, versioned artifacts, dependency metadata, policy records, audit metadata, usage/cost records, and vectorized knowledge retrieval.

Using PostgreSQL as the primary relational store reduces unnecessary infrastructure for v1 while still allowing a credible enterprise architecture.

## Decision

AI Nexus will use **PostgreSQL as the primary relational data store** and **pgvector for vector retrieval**.

PostgreSQL will hold platform metadata including, as applicable:

- identities/tenant references
- artifact and version metadata
- dependency relationships
- policies and policy versions
- agent/tool/model/knowledge registries
- evaluation definitions/results
- audit/security metadata
- usage/cost records
- marketplace metadata

pgvector will store embeddings associated with versioned knowledge chunks.

The knowledge model must preserve provenance and authorization metadata so retrieval can be filtered by applicable access constraints.

## Rationale

This directly closes the PostgreSQL/pgvector and enterprise RAG gaps identified in Stage 1 while keeping the data architecture understandable for a portfolio implementation.

## Consequences

- Relational and vector data can participate in a coherent data model.
- Indexing, query planning, transactions, migrations, JSONB, concurrency, and vector retrieval become hands-on implementation concerns.
- The architecture must avoid treating pgvector as a substitute for source-of-truth document storage.
- A future enterprise deployment may introduce specialized data systems where scale or workload isolation requires them; that does not invalidate PostgreSQL as the v1 platform foundation.
