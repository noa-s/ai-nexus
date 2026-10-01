# ADR-009: Governed RAG, Provenance, and Source Versioning

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

AI Nexus needs enterprise RAG for governed use cases such as organizational knowledge, engineering/maintenance information, internal procedures, and other approved enterprise documents. Stage 1 requires ingestion, chunking, embeddings, metadata, retrieval, access control, citations/provenance, and evaluation.

A retrieved chunk must be attributable to the exact source version from which it was generated. Source documents can change independently of AI Nexus, so source change detection is part of the architecture even if all detection mechanisms are not implemented in v1.

## Decision

RAG will be implemented as a governed runtime capability rather than a raw vector search endpoint.

The RAG flow includes:

```text
query
  -> retrieval policy
  -> authorization filtering
  -> query transformation
  -> vector/metadata retrieval
  -> optional reranking
  -> provenance capture
  -> context assembly
```

### Versioning

A source document is represented by an immutable **document version**. A retrieved chunk references a `document_version_id`, meaning the exact version of the source document from which that chunk was produced.

For example:

```text
maintenance-manual.pdf
  -> document version 7
  -> chunk 7-143
```

If the source changes, a new document version is created and new chunks/embeddings are generated. Existing versions remain available for historical traceability.

### Source change detection options

The architecture will support connector-specific change detection strategies, including:

- source-provided revision/version IDs
- last-modified timestamps
- content hashes such as SHA-256
- source events/webhooks
- scheduled synchronization/polling

A connector may combine methods. Change detection determines whether re-ingestion is needed; version creation establishes the immutable platform representation.

### Provenance metadata

A chunk should be able to retain metadata such as:

- source/document identity
- `document_version_id`
- source revision identifier where available
- content hash where available
- source location
- chunk index
- embedding model/version
- ingestion pipeline/version
- data classification/access metadata

### Governance

Retrieval must respect authorization and data-classification constraints before retrieved content is provided to an agent/model. RAG therefore participates in the platform's governance story rather than bypassing it.

## Consequences

- Answers can be traced to exact source versions.
- Knowledge changes can be detected without mutating historical evidence.
- Retrieval can enforce access boundaries.
- Re-indexing can be targeted to changed source versions.
- Connector implementations have flexibility in how source changes are detected.
