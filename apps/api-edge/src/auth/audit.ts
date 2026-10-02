import { randomUUID } from "node:crypto";
import { authorize } from "./authorization.js";
import type { AuthorizationPolicySet } from "./authorization.js";
import type { AuthorizationResult, IdentityContext } from "./types.js";

export interface AuthorizationAuditEvent {
  eventId: string;
  eventType: "AUTHORIZATION_DECISION" | "AUTHORIZATION_DENIED" | "AUDIT_READ";
  principalId?: string;
  workloadId?: string;
  agentId?: string;
  tenantId: string;
  action: string;
  target: string;
  resourceRef?: string;
  requestId: string;
  decisionId?: string;
  decision?: AuthorizationResult["decision"];
  reasonCode: string;
  policyVersions: string[];
  traceId?: string;
  createdAt: string;
}

export interface AuditEventStore {
  append(event: AuthorizationAuditEvent): void;
  listByTenant(tenantId: string): readonly AuthorizationAuditEvent[];
}

export class InMemoryAuditEventStore implements AuditEventStore {
  private readonly events: AuthorizationAuditEvent[] = [];

  append(event: AuthorizationAuditEvent): void {
    this.events.push(Object.freeze({ ...event, policyVersions: [...event.policyVersions] }));
  }

  listByTenant(tenantId: string): readonly AuthorizationAuditEvent[] {
    return this.events.filter((event) => event.tenantId === tenantId);
  }
}

export const auditEventStore = new InMemoryAuditEventStore();

const toEvent = (identity: IdentityContext, result: AuthorizationResult): AuthorizationAuditEvent => ({
  eventId: result.decisionId,
  eventType: result.decision === "DENY" ? "AUTHORIZATION_DENIED" : "AUTHORIZATION_DECISION",
  principalId: identity.principalType === "human" ? identity.subject : undefined,
  workloadId: identity.workloadId ?? (identity.principalType === "workload" ? identity.subject : undefined),
  agentId: identity.agentId,
  tenantId: identity.tenantId,
  action: result.action,
  target: result.target,
  requestId: result.requestId,
  decisionId: result.decisionId,
  decision: result.decision,
  reasonCode: result.reasonCode,
  policyVersions: result.policyVersions,
  traceId: result.traceId,
  createdAt: result.evaluatedAt,
});

export function recordAuthorizationEvent(
  identity: IdentityContext,
  result: AuthorizationResult,
  store: AuditEventStore = auditEventStore,
): AuthorizationAuditEvent {
  const event = toEvent(identity, result);
  store.append(event);
  return event;
}

export function readAuthorizationEvents(
  identity: IdentityContext,
  policySet: AuthorizationPolicySet,
  store: AuditEventStore = auditEventStore,
  traceId?: string,
): readonly AuthorizationAuditEvent[] {
  const requestId = randomUUID();
  const result = authorize(identity, {
    requestId,
    tenantId: identity.tenantId,
    action: "evidence.read",
    target: "authorization-events",
    purpose: "audit-investigation",
  }, policySet, traceId);

  if (result.decision !== "ALLOW") return [];

  const evidence = [...store.listByTenant(identity.tenantId)];
  store.append({
    eventId: randomUUID(),
    eventType: "AUDIT_READ",
    principalId: identity.principalType === "human" ? identity.subject : undefined,
    workloadId: identity.workloadId ?? (identity.principalType === "workload" ? identity.subject : undefined),
    agentId: identity.agentId,
    tenantId: identity.tenantId,
    action: "evidence.read",
    target: "authorization-events",
    resourceRef: "authorization-events",
    requestId,
    decision: "ALLOW",
    reasonCode: "AUDITOR_EVIDENCE_READ",
    policyVersions: result.policyVersions,
    traceId,
    createdAt: new Date().toISOString(),
  });
  return evidence;
}
