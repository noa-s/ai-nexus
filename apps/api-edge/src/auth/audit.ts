import type { AuthorizationResult, IdentityContext } from "./types.js";

export interface AuthorizationAuditEvent {
  eventId: string;
  eventType: "AUTHORIZATION_DECISION" | "AUTHORIZATION_DENIED";
  principalId?: string;
  workloadId?: string;
  tenantId: string;
  requestId: string;
  decisionId: string;
  decision: AuthorizationResult["decision"];
  reasonCode: string;
  policyVersions: string[];
  traceId?: string;
  createdAt: string;
}

const events: AuthorizationAuditEvent[] = [];

export function recordAuthorizationEvent(identity: IdentityContext, result: AuthorizationResult): AuthorizationAuditEvent {
  const event: AuthorizationAuditEvent = {
    eventId: result.decisionId,
    eventType: result.decision === "DENY" ? "AUTHORIZATION_DENIED" : "AUTHORIZATION_DECISION",
    principalId: identity.principalType === "human" ? identity.subject : undefined,
    workloadId: identity.workloadId ?? (identity.principalType === "workload" ? identity.subject : undefined),
    tenantId: identity.tenantId,
    requestId: result.requestId,
    decisionId: result.decisionId,
    decision: result.decision,
    reasonCode: result.reasonCode,
    policyVersions: result.policyVersions,
    traceId: result.traceId,
    createdAt: result.evaluatedAt,
  };
  events.push(event);
  return event;
}

export function getAuthorizationEvents(): readonly AuthorizationAuditEvent[] {
  return events;
}
