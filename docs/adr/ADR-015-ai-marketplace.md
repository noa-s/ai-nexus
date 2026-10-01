# ADR-015: Governed AI Marketplace and Conversational Discovery

- **Status:** Proposed
- **Date:** 2026-10-01

## Context

The enterprise marketplace must support discovery, access requests, approval, use, monitoring, and audit. Employees will not necessarily know which agent exists or which agent matches their task.

A fixed cost/request displayed as a commitment is misleading because model choice, token usage, retries, and workload vary dynamically.

## Decision

AI Nexus will provide a governed internal **AI Marketplace** with both:

1. catalog/search discovery
2. conversational discovery that can help users describe their need and suggest appropriate registered agents

The conversational discovery capability itself is subject to the same security, authorization, observability, and cost controls as other AI capabilities.

### Agent card

An agent card should include at least:

- name
- description
- owner
- business unit
- version
- status
- risk level
- data classification
- allowed tools
- allowed models/capabilities
- evaluation status/scores
- historical/estimated cost information where useful
- deployment status
- access requirements

The card must not imply a guaranteed fixed cost/request. Where cost is displayed, it should be clearly labeled as historical, estimated, average, range, or maximum configured cost as applicable.

### Access lifecycle

```text
Discover
  -> evaluate
  -> request access
  -> approve (when required)
  -> use
  -> monitor
  -> audit
```

## Consequences

- Users can discover capabilities without already knowing agent names.
- Marketplace access is governed rather than treated as a public app directory.
- Agent descriptions become an important usability and governance artifact.
- Conversational discovery introduces another AI workflow that must itself be governed.
