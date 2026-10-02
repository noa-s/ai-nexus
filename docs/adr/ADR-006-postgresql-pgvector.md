# ADR-006: PostgreSQL + pgvector as the Platform Data Foundation

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

Stage 1 identifies PostgreSQL and pgvector as important hands-on gaps to close. AI Nexus needs transactional platform state, versioned artifacts, dependency metadata, policy records, audit metadata, usage/cost records, and vectorized knowledge retrieval.

Using PostgreSQL as the primary relational store reduces unnecessary infrastructure for v1 while still allowing a credible enterprise architecture.

## Decision

AI Nexus will use **PostgreSQL as the primary relational data store** and **pgvector for vector retrieval**.

PostgreSQL will hold platform metadata including, as applicable:

- identities/tenant and organizational references
- artifact and version metadata
- version-to-version dependency relationships
- policies and immutable policy versions
- agent/tool/model/knowledge registries
- evaluation definitions/results
- audit/security metadata
- usage/cost records
- marketplace metadata
- governed knowledge metadata and provenance

The relational model is also responsible for preserving the relationships required for dependency analysis, impact analysis, reproducibility, evaluation, audit, and release decisions.

pgvector will store embeddings associated with versioned knowledge chunks. Embeddings are **derived data**, not the source of truth for the source document.

## Knowledge lineage

The knowledge model will preserve explicit lineage between the external source, its immutable document version, derived chunks, and embeddings:

```text
Source system/document
        |
        v
Document Version
        |
        v
Chunk Version
        |
        v
Embedding
        |
        v
pgvector
```

A `document_version_id` identifies the immutable version of the source document from which a chunk was derived. If the source changes, a new document version and corresponding derived chunks/embeddings are created rather than mutating the old version's embedding in place.

The source document itself may remain in an external system such as SharePoint, OneDrive, object storage, Git, or another enterprise repository. AI Nexus stores the governed representation, metadata, lineage, and retrieval artifacts needed by the platform; it does not assume PostgreSQL is the authoritative source for every enterprise document.

## Governed retrieval

Knowledge retrieval is an authorization-aware operation, not simply nearest-neighbor vector search.

The retrieval flow must be able to apply relevant identity, tenant/organizational, classification, provenance, document-version, and policy constraints before or as part of candidate retrieval so that unauthorized knowledge is not exposed to an agent or user.

The architecture should support combining semantic similarity with metadata filtering and, where justified, lexical/hybrid retrieval. The exact retrieval strategy is an implementation decision rather than a requirement that every query use vector similarity alone.

## Domain ownership

PostgreSQL may be a shared physical database in v1, but logical domain ownership follows ADR-004. A service must not directly manipulate another service's domain-owned tables regardless of implementation language.

For example:

```text
PostgreSQL
|
+-- artifact domain
+-- policy domain
+-- knowledge domain
+-- evaluation domain
+-- usage domain
+-- marketplace domain
```

Cross-domain access occurs through explicit service contracts or approved asynchronous events/messages.

## Rationale

This directly closes the PostgreSQL/pgvector and enterprise RAG gaps identified in Stage 1 while keeping the data architecture understandable for a portfolio implementation.

It also provides one coherent relational foundation for versioning, governance, RAG provenance, evaluation, audit, and FinOps while preserving future microservice extraction boundaries.

## Consequences

- Relational and vector data can participate in a coherent data model.
- Indexing, query planning, transactions, migrations, JSONB, concurrency, and vector retrieval become hands-on implementation concerns.
- Versioned knowledge remains reproducible because derived embeddings retain source-version lineage.
- Authorization metadata becomes part of the retrieval data model rather than an afterthought.
- The architecture must avoid treating pgvector as a substitute for source-of-truth document storage.
- A future enterprise deployment may introduce specialized data systems where scale or workload isolation requires them; that does not invalidate PostgreSQL as the v1 platform foundation.
