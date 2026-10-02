# AI Nexus — Agent Working Rules

**Status:** Draft for review  
**Scope:** Repository-wide  
**Applies to:** Any AI agent, coding assistant, automation, or autonomous development workflow working in this repository.

The authoritative architectural decisions are maintained in `docs/adr/`.

## Core rules

- Implementation authority is not architectural authority.
- Merged ADRs are the architectural baseline unless superseded by an approved decision.
- Do not silently resolve conflicts between authoritative artifacts, requirements, implementation, or tests.
- Prefer the smallest correct change.
- Security and governance are mandatory constraints.
- Agent output is not authoritative merely because it exists.
- Before changing an architectural area, identify and read the current relevant ADRs rather than relying on copied summaries.
- Do not commit secrets, credentials, private keys, access tokens, or sensitive configuration values.
- Validate applicable tests, builds, type checks, security checks, and other required gates before declaring work complete.
- Keep changes reviewable and use task-specific branches and pull requests.

## Source of truth

Agents must distinguish among:

- **Authoritative:** approved/merged ADRs, approved requirements/specifications, and explicit human decisions.
- **Current implementation:** existing source code, configuration, tests, and infrastructure.
- **Proposed:** agent recommendations, draft ADRs, draft specifications, and unmerged changes.
- **External evidence:** official technical documentation, standards, vendor documentation, and research.
- **Agent inference:** conclusions derived from available evidence.

Do not copy individual ADR requirements into this file. If an ADR changes, agents must discover the current decision by reading the ADR.

## Architecture and boundaries

Code placement must follow responsibility and ownership rather than convenience. Before moving code into `libs`, `shared`, or another common location, establish that the code is genuinely shared and that the move does not create an inappropriate dependency direction.

For AI/agent changes, consult applicable ADRs and security/governance documentation before modifying execution, model access, retrieval, tools, policies, evaluation, or observability behavior. Do not create a parallel implementation path merely because it is locally convenient.

## Security and secrets

Agents MUST NOT:

- place credentials or tokens in source code;
- expose secrets in logs, prompts, fixtures, commits, or documentation;
- bypass authentication or authorization to simplify development;
- disable or weaken security checks merely to make a test or implementation pass;
- transmit sensitive information to external services unless explicitly permitted.

## Testing and validation

Create or update tests appropriate to changed behavior. If a required check cannot be run, report that fact and the reason instead of claiming the change is fully validated.

## Git and GitHub

Agents must not rewrite protected history, force-push protected branches, bypass required review, or merge architectural changes without required approval. A pull request should describe what changed, why, validation performed, and known limitations.

## Definition of done

Before declaring work complete, verify that the requested behavior is implemented, relevant architecture was consulted, applicable validation passes, security implications were considered, documentation is updated where required, no unrelated changes were introduced, and unresolved architectural/governance decisions are surfaced.

## Lessons from implementation reviews

These operational lessons are promoted to repository-wide guidance because they materially reduce correctness, security, and maintenance risk:

- **Keep related artifacts internally consistent.** Branch names, CI triggers, file names, test names, module names, documentation, Docker/Compose paths, and actual repository structure must describe the same architecture. Do not introduce a name or branch that does not exist merely because it is common in a template.
- **Do not create unused live artifacts.** Do not add contracts, schemas, modules, services, configuration, or other runtime-facing artifacts merely because they may be useful later. A new artifact should either be consumed by the current implementation or have a documented, reviewable reason to exist as an intentional foundation artifact.
- **Close processes and resources deterministically.** Tests, scripts, CI jobs, and development workflows must terminate processes, containers, networks, volumes, temporary resources, and other live sessions when they are no longer needed. Cleanup must run on both success and failure where practical, such as `finally` in application code and `if: always()` cleanup in CI.
- **Do not keep unused live sessions open.** Agents and automation should not leave background servers, shells, database sessions, containers, tunnels, credentials, or other live resources running after the task or validation that required them has finished. This reduces resource leakage and the risk of sensitive data remaining accessible longer than necessary.
- **Prefer evidence over assumptions.** Before marking a step ready or complete, inspect the actual repository and validate the actual execution path. A planned artifact, naming convention, or intended runtime boundary is not evidence that it exists or works.

## Changing these rules

`AGENTS.md` is a governed repository artifact. Changes require review and approval through the normal Git/GitHub workflow. An agent must not modify these rules and then use the unapproved changes as justification for autonomous action.
