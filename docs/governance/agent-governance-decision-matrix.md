# AI Nexus — Agent Governance Decision Matrix

**Status:** Draft for review  
**Purpose:** Record governance questions for AI agents while keeping architectural decisions in their authoritative ADRs.

## Source-of-truth rule

Architectural decisions belong to the current ADRs under `docs/adr/`. This matrix must **not reproduce ADR contents**. It records where an agent should look and which agent-behavior rule applies.

| Question / Area | Authority / Source | Agent behavior |
|---|---|---|
| What architecture applies to this change? | Current relevant ADR(s) in `docs/adr/` | Read the current ADR before changing an affected architectural area. |
| Can an agent change an architectural decision? | ADR process + Agent Governance | No silent changes; propose and obtain required approval. |
| What are the repository's structural boundaries? | Current ADRs + repository structure documentation | Inspect the current guidance before creating/moving/extracting code. |
| What language/framework/runtime should be used? | Current relevant ADR(s) + engineering standards | Follow the current decision; do not choose based on agent preference. |
| What tests are required? | Engineering/testing standards | Determine applicable checks and report anything not run. |
| What coverage gate applies? | Engineering/testing standards | Do not invent a threshold in `AGENTS.md`. |
| Can a dependency be added or upgraded? | Engineering standards + relevant ADRs | Check current policy and architectural impact first. |
| What security controls apply? | Current security documentation + relevant ADRs | Follow the current controls; never weaken them for convenience. |
| What branch/PR workflow applies? | Repository/Git governance | Follow the current workflow; do not rewrite shared history. |
| Can another agent's output be trusted? | `AGENTS.md` | Treat it as proposal/evidence until verified against authoritative sources. |
| Can `AGENTS.md` itself be changed? | `AGENTS.md` | Requires explicit human approval through normal review. |

## Governance questions still requiring explicit project decisions

These questions are not fully determined by the architectural ADRs and should become explicit repository governance before agents are expected to enforce them:

- exact protected files and directories;
- exact files/changes requiring human approval;
- whether agents may commit directly or only through pull requests;
- branch naming and merge rules;
- whether agents may create, move, or delete files autonomously;
- exact `apps` / `libs` / `shared` conventions;
- exact frontend conventions not already defined by architecture;
- maximum function/file length and complexity thresholds;
- exact coverage gates and test matrix;
- mandatory lint/typecheck/build/security commands;
- dependency addition and upgrade approval rules;
- exact runtime/tool versions where not already pinned by the repository;
- rules for scope expansion and opportunistic refactoring;
- exact escalation mechanism for architectural ambiguity;
- rules for agent-to-agent handoffs and verification;
- required documentation for particular classes of changes.

## Decision format

For each unresolved item, record:

1. **Question**
2. **Proposed default**
3. **Agent authority** — autonomous / report / approval required / prohibited
4. **Human approval requirement**
5. **Affected files/directories**
6. **Validation required**
7. **Rationale**

This matrix is intentionally a draft. It does not convert unresolved questions into mandatory repository policy until explicitly approved.
