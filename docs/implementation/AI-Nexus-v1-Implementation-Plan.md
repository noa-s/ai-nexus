# AI Nexus v1 — Implementation Plan

- **Status:** Draft — Stage 4.2 — Step 03 In Progress
- **Version:** 0.4
- **Date:** 2026-10-02
- **Architectural baseline:** Accepted ADR-001 through ADR-018
- **Requirements baseline:** `docs/architecture/AI-Nexus-v1-Requirements-and-Architecture-Specification.md` v0.7
- **Discovery baseline:** `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md` v0.2

## 1. Purpose

This document is the **implementation control plan** for AI Nexus v1. It defines the ordered implementation steps, hierarchy, dependencies, and completion rules. It is intentionally not a replacement for the detailed step specifications.

The implementation plan is derived from three sources that must all be consulted:

1. the accepted ADRs in `docs/adr/`;
2. the v1 Requirements & Architecture Specification;
3. the actual repository state on the current implementation branch.

The specification is the implementation requirements index. The ADRs remain the authority for architectural decisions and constraints. Existing code describes the current state but does not override an accepted ADR or approved specification.

## 2. Source-of-truth hierarchy

```text
Accepted ADRs
    ↓
Architectural decisions / constraints
    ↓
AI Nexus v1 Requirements & Architecture Specification
    ↓
Implementation Step Specification
    ↓
Code / tests / infrastructure
```

An implementation step MUST reference the relevant ADRs and specification requirements. It MUST NOT silently reinterpret or supersede an accepted architectural decision.

## 3. Implementation operating rules

1. Implementation proceeds in dependency order.
2. **Only one implementation step may be ACTIVE at a time.**
3. A step cannot become ACTIVE until all declared prerequisite steps are `COMPLETE`.
4. A step is not `COMPLETE` because code exists. Its acceptance criteria and Definition of Done must be satisfied.
5. The step PR must be merged before the step can be marked `COMPLETE`.
6. Staging verification is part of completion.
7. If acceptance or validation fails, the current step returns to `IN PROGRESS`; the next step does not start.
8. Architectural ambiguity or contradiction must be surfaced before implementation proceeds in the affected area.
9. Unrelated refactoring, dependency upgrades, or architectural changes must not be silently combined with the active step.
10. The detailed step document is the execution contract for that step.

## 4. Step lifecycle

```text
PLANNED
   ↓
READY
   ↓
IN PROGRESS
   ↓
VALIDATION
   ↓
ACCEPTANCE REVIEW
   ↓
PR MERGED
   ↓
STAGING VERIFIED
   ↓
COMPLETE
```

Failure at validation or acceptance returns the step to `IN PROGRESS`.

## 5. Required traceability for every step

Each step specification MUST identify:

- step ID and title;
- current status;
- prerequisite steps;
- relevant ADRs;
- relevant specification sections/requirement IDs;
- current repository baseline/gap;
- implementation scope;
- explicit non-scope;
- contracts/interfaces affected;
- data ownership affected;
- security/governance implications;
- tests and validation;
- acceptance criteria;
- Definition of Done;
- completion evidence.

Traceability must follow:

```text
ADR
 ↓
Requirement / constraint
 ↓
Specification section
 ↓
Implementation step
 ↓
Code / infrastructure
 ↓
Test / evaluation / security check
 ↓
Acceptance evidence
```

## 6. Implementation hierarchy and dependency order

The following is the **initial v1 execution order** derived from the accepted ADRs, specification, repository baseline, and the Stage 4.2 discovery. The order is intentionally conservative: a later step may not start merely because its code could be developed independently; it starts when its architectural prerequisites are complete.

### Phase 1 — Foundation

**Step 01 — Repository & Platform Foundation** — `COMPLETE`

- Dependencies: none
- Detailed plan: `steps/01-repository-and-platform-foundation.md`
- Discovery: `docs/implementation/AI-Nexus-v1-Repository-and-Architecture-Discovery.md`
- Completion evidence: PR #16 merged to `staging`; final CI run for commit `12b23afa2a28279bd017ba612f5628c853071ef2` passed (workflow run `36967666739`).
- Covers: monorepo/service-module structure, Node.js/TypeScript and Python foundations, shared language-neutral contracts, PostgreSQL + pgvector foundation, configuration, service identity foundations, container development support, and CI baseline.

### Phase 2 — Control Plane foundations

**Step 02 — Identity, Authorization & Policy Foundation** — `COMPLETE`

- Depends on: Step 01
- Detailed plan: `steps/02-identity-authorization-and-policy-foundation.md`
- Completion evidence: PR #18 merged to `staging` at merge commit `dee4be728c2683af1c1daa1cc97f52f2fe58a5aa`; PR validation passed before merge.
- Establishes the shared authorization/policy boundary, workload/service identity authorization, immutable policy foundation, Auditor role boundary, protected service-to-service communication, and the initial language-neutral authorization contracts before protected runtime capabilities.

**Step 03 — Artifact, Agent & Version Registry** — `IN PROGRESS`

- Depends on: Step 02
- Detailed plan: `steps/03-artifact-agent-and-version-registry.md`
- Current branch: `impl/step-03-artifact-agent-version-registry`
- Establishes the authoritative Artifact/Agent Registry, immutable version identity, Agent registration/versioning, lifecycle metadata, exact policy-version references, declared dependency-reference contracts, scoped registry authorization, and registry audit behavior.
- Explicitly does not implement the Dependency Analyzer, Model Registry, Agent Runtime, LLM Gateway, RAG Runtime, Tool/MCP Runtime, or Marketplace.

**Step 04 — Dependency Analyzer & Impact Graph**

- Depends on: Step 03
- Implements deterministic repository scanning, version/dependency evidence, direct/transitive impact analysis, and PR/CI enforcement.

**Step 05 — Model Registry**

- Depends on: Step 03
- Establishes the authoritative model/provider capability metadata used by routing.

### Phase 3 — Governed execution foundations

**Step 06 — LLM Gateway & Model Router**

- Depends on: Steps 02, 04, 05
- Establishes the single governed LLM access path, provider adapters, constrained routing, fallback, usage telemetry, and routing evidence.

**Step 07 — Causal Observability & Evidence Foundation**

- Depends on: Steps 01, 02, 03, 06
- Establishes trace/span/event/decision contracts, correlation, artifact/policy references, security-event linkage, and protected evidence handling.

**Step 08 — Agent Runtime**

- Depends on: Steps 03, 06, 07
- Implements the governed eight-stage Agent execution lifecycle and orchestration boundary.

**Step 09 — RAG / Knowledge Runtime**

- Depends on: Steps 02, 03, 07, 08
- Implements governed ingestion, versioned knowledge lineage, retrieval authorization, provenance, and Python processing workers.

**Step 10 — Tool / MCP Runtime**

- Depends on: Steps 02, 03, 04, 07, 08
- Implements registered tools, MCP boundaries, authorization, approvals, credential isolation, execution, validation, and dependency impact.

### Phase 4 — Governance, quality and economics

**Step 11 — Evaluation Runtime & Release Gates**

- Depends on: Steps 04, 06, 07, 08, 09, 10
- Implements versioned evaluation runs/datasets/metrics, deterministic and semantic evaluation, groundedness, and blocking release gates.

**Step 12 — FinOps & Business-Value Attribution**

- Depends on: Steps 06, 07, 08, 11
- Implements usage/cost attribution, versioned pricing, budgets/limits, anomaly signals, optimization evidence, and business-value evidence separation.

### Phase 5 — Enterprise integration surfaces

**Step 13 — AI Marketplace**

- Depends on: Steps 03, 04, 08, 11, 12
- Implements governed publication, Agent Cards, catalog/conversational discovery, access workflows, and version-aware trust/economic signals.

**Step 14 — MCP Ecosystem & Copilot Studio Integration**

- Depends on: Steps 02, 06, 07, 08, 10, 13
- Completes external MCP integration boundaries, the v1 Copilot Studio custom connector/API path, Microsoft identity mapping, and external integration contracts. Secure polyglot service-to-service communication is established earlier in Step 02 and consumed here rather than deferred to the integration phase.

### Phase 6 — Production engineering

**Step 15 — Terraform, Environment Promotion & Production-Like Deployment**

- Depends on: Steps 01–14
- Implements Terraform/IaC, environment separation, immutable deployment artifacts, GitHub Actions release flow, secrets integration, health/readiness, migration compatibility, rollback, staging/demo hosting, and final v1 system acceptance.

## 7. Step status rules

The status shown in this file is the authoritative execution status for the roadmap. Detailed step files may contain additional validation state but must not claim completion while the roadmap still shows the step incomplete.

Allowed statuses:

- `PLANNED`
- `READY`
- `IN PROGRESS`
- `VALIDATION`
- `ACCEPTANCE REVIEW`
- `COMPLETE`
- `BLOCKED`

## 8. Stage 4 completion gate

Stage 4 is complete only when:

- every required v1 implementation step is `COMPLETE`;
- all step acceptance criteria are satisfied;
- all step PRs are merged;
- staging verification has been performed;
- final v1 system acceptance criteria from the Stage 3B specification are evidenced;
- no unresolved architectural contradiction remains;
- known implementation limitations are documented.

## 9. Current implementation baseline

Steps 01 and 02 are complete and merged to `staging`. Step 03 is now the current controlled implementation step. Its detailed execution contract is defined in `steps/03-artifact-agent-and-version-registry.md`.

## 10. Current controlled action

**Step 03 is IN PROGRESS.** Implementation must remain within the Step 03 scope and Definition of Done. No Step 04 or Step 05 work may begin until Step 03 is complete and verified on `staging`.
