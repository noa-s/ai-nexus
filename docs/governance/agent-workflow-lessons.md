# AI Nexus — Agent Workflow Lessons

**Status:** Proposed for review
**Purpose:** Capture reusable lessons from AI-assisted repository work before deciding whether they belong in `AGENTS.md`.

This document is intentionally separate from `AGENTS.md`. A lesson should be promoted into the repository-wide agent contract only after review confirms that it is broadly applicable and does not unnecessarily constrain legitimate workflows.

## 1. Preserve the authoritative artifact structure

When a task explicitly continues an existing specification, design document, plan, or other authoritative artifact, extend that artifact rather than creating parallel stage-specific copies.

Before creating a new document, an agent should ask:

1. Is there already an authoritative document for this subject?
2. Is the requested work a new section/version of that document?
3. Would a second document create synchronization or source-of-truth problems?
4. Does the repository architecture explicitly require separate artifacts?

A new document is appropriate only when the information has a distinct ownership, lifecycle, audience, or governance boundary.

## 2. Separate architectural authority from specification detail

ADRs define architectural decisions. A requirements/architecture specification should reference those decisions and define the concrete requirements, interfaces, contracts, boundaries, acceptance criteria, and implementation constraints that follow from them.

Agents should not copy ADR decisions into downstream documents merely for convenience. If a downstream document repeats a decision, it can become stale when the ADR changes.

The preferred relationship is:

```text
ADR
  ↓ authoritative decision
Requirements / Architecture Specification
  ↓ concrete contracts and requirements
Implementation
  ↓ tests / deployment
```

## 3. Inspect before extending

Before continuing a multi-stage artifact, an agent should inspect the current target branch and the current artifact itself, even if the previous stage was produced by the same agent.

The agent should verify:

- current branch/base;
- current file structure;
- current document status/version;
- merged versus unmerged work;
- relevant ADRs and governance rules;
- whether the requested work already exists partially.

This prevents building the next stage on an assumed rather than actual repository state.

## 4. Treat stage labels as work slices, not necessarily file boundaries

A stage such as `Stage 3B.3` describes a unit of work. It does not automatically imply a new document.

If Stage 3B is defined as one authoritative specification, Stage 3B.1, 3B.2, 3B.3, etc. should normally become sections or revisions of that specification.

## 5. Review the shape of the deliverable before writing content

For architecture/specification tasks, first confirm:

```text
What is the authoritative artifact?
What is its ownership/lifecycle?
What belongs inside it?
What should remain referenced externally?
```

Only then should the agent draft or modify content.

## 6. Keep PRs aligned with the requested unit of change

A PR should make the smallest coherent change to the authoritative artifact.

A PR should not introduce a parallel document merely because it is easier to write independently. If a staged task belongs in an existing specification, the PR should update that specification and explain the added section.

## 7. Do not claim completion without verifying the resulting repository state

After a GitHub mutation, the agent should verify:

- the intended branch contains the commit;
- the PR points to that branch;
- the changed file is actually the intended file;
- the PR base is correct;
- the PR is open/merged as expected;
- the final diff matches the described scope.

Tool success alone is not sufficient evidence that the repository is in the intended state.

## 8. Keep lessons separate from binding rules until reviewed

Observed mistakes and workflow lessons should first be captured as proposals. They should not automatically become binding agent rules.

Promotion into `AGENTS.md` should require review for:

- general applicability;
- compatibility with existing rules;
- appropriate level of constraint;
- interaction with repository governance;
- risk of turning a useful heuristic into an unnecessary hard requirement.

## 9. Current lesson from Stage 3B

The Stage 3B work demonstrated why the distinction matters: Data Architecture and Runtime Architecture were initially prepared as a separate staged deliverable even though the project had already established a single authoritative v1 specification. The correct approach is to keep those sections inside the existing specification and use the ADRs as referenced architectural authority.

This lesson should be considered a candidate for future inclusion in `AGENTS.md`, subject to review.
