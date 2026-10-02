# ADR-009: Governed RAG, Provenance, and Source Versioning

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

AI Nexus needs enterprise RAG for governed use cases such as organizational knowledge, engineering/maintenance information, internal procedures, and other approved enterprise documents. Stage 1 requires ingestion, chunking, embeddings, metadata, retrieval, access control, citations/provenance, and evaluation.

A retrieved chunk must be attributable to the exact source version from which it was generated. Source documents can change independently of AI Nexus, so source change detection is part of the architecture even if all detection mechanisms are not implemented in v1.

## Decision

RAG will be implemented as a governed runtime capability rather than a raw vector search endpoint.

The RAG flow includes:

```text
query
  -> effective knowledge constraints
  -> authorization filtering
  -> query transformation
  -> vector/metadata retrieval
  -> optional reranking
  -> provenance capture
  -> context assembly
```

### Versioning and lineage

A source document is represented by an immutable **document version**. A retrieved chunk references a `document_version_id`, meaning the exact version of the source document from which that chunk was produced.

For example:

```text
maintenance-manual.pdf
  -> document version 7
  -> chunk 7-143
```

If the source changes, a new document version is created and new chunks/embeddings are generated. Existing versions remain available for historical traceability.

Chunk identity is scoped to its source document version. A chunk identifier must not be interpreted as proving that chunks with the same ordinal position across document versions contain the same content.

The following version dimensions are distinct and should be preserved where applicable:

- `document_version_id` — version of the external/source document represented by AI Nexus
- embedding model/version — model representation used to generate the vector
- ingestion pipeline/version — version of the processing logic/configuration that generated chunks and embeddings

For example:

```text
Document version 7
  -> chunk 7-143
  -> embedding model version E3
  -> ingestion pipeline version I1.4.2
```

This allows retrieval results and re-indexing decisions to remain reproducible and auditable.

### Source change detection options

The architecture will support connector-specific change detection strategies, including:

- source-provided revision/version IDs
- last-modified timestamps
- content hashes such as SHA-256
- source events/webhooks
- scheduled synchronization/polling

A connector is responsible for observing the external source and detecting a relevant change. The ingestion/versioning pipeline is responsible for creating the corresponding immutable AI Nexus document version and derived chunks/embeddings.

A connector may combine multiple detection methods. Change detection determines whether re-ingestion is needed; version creation establishes the immutable platform representation.

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

Provenance should remain available through the runtime flow so that a final answer can expose appropriate source/citation information to an authorized user without exposing internal identifiers unnecessarily.

### Governance

Retrieval must respect the effective authorization constraints before retrieved content is provided to an agent/model. These constraints may include:

- user identity and permissions
- tenant/organizational restrictions
- data classification
- knowledge/RAG policy
- Agent policy and its allowed knowledge scope
- other applicable platform constraints

The effective constraints are passed to the RAG Runtime, which independently enforces its knowledge-access boundary. RAG therefore participates in the platform's governance story rather than bypassing it.

## Consequences

- Answers can be traced to exact source versions.
- Knowledge changes can be detected without mutating historical evidence.
- Retrieval can enforce access boundaries.
- Re-indexing can be targeted to changed source versions.
- Connector implementations have flexibility in how source changes are detected.
- Embedding and ingestion changes remain distinguishable from source-document changes.
- Provenance can flow from source document through retrieval to the generated answer.
