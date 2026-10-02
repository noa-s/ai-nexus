import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { authorize, type AuthorizationPolicySet } from "./authorization.js";
import { auditEventStore, recordAuthorizationEvent, type AuditEventStore } from "./audit.js";
import { demoPolicyRegistry, type PolicyRegistry } from "./policy-registry.js";
import { verifySignedToken } from "./signed-token.js";
import type { AuthorizationRequest, IdentityContext } from "./types.js";

export type PolicySetProvider = () => AuthorizationPolicySet;

export const demoPolicyProvider: PolicySetProvider = () =>
  demoPolicyRegistry.getAuthorizationPolicySet("service", "api-edge");

export function authenticate(headers: IncomingHttpHeaders, secret: string): IdentityContext | null {
  const header = headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return verifySignedToken(header.slice("Bearer ".length), secret);
}

export function requireAuthorization(
  request: IncomingMessage,
  response: ServerResponse,
  action: string,
  target: string,
  policyProvider: PolicySetProvider = demoPolicyProvider,
  auditStore: AuditEventStore = auditEventStore,
): boolean {
  const secret = process.env.AUTH_TOKEN_SECRET ?? "";
  const identity = authenticate(request.headers, secret);
  const requestId = request.headers["x-request-id"]?.toString() || randomUUID();
  const traceId = request.headers["x-trace-id"]?.toString();

  if (!identity) {
    response.writeHead(401, { "content-type": "application/json", "x-request-id": requestId });
    response.end(JSON.stringify({ error: "unauthenticated", requestId }));
    return false;
  }

  let policySet: AuthorizationPolicySet;
  try {
    policySet = policyProvider();
  } catch {
    response.writeHead(503, { "content-type": "application/json", "x-request-id": requestId });
    response.end(JSON.stringify({ error: "authorization_unavailable", requestId }));
    return false;
  }

  const authorizationRequest: AuthorizationRequest = {
    requestId,
    actor: identity.principalType === "human" ? identity.subject : undefined,
    tenantId: identity.tenantId,
    workload: identity.workloadId,
    agent: identity.agentId,
    action,
    target,
    purpose: "api-edge",
  };

  const result = authorize(identity, authorizationRequest, policySet, traceId);
  recordAuthorizationEvent(identity, result, auditStore);

  if (result.decision !== "ALLOW") {
    response.writeHead(403, { "content-type": "application/json", "x-request-id": requestId });
    response.end(JSON.stringify({ error: "forbidden", reasonCode: result.reasonCode, decisionId: result.decisionId, requestId }));
    return false;
  }

  return true;
}

export const policyRegistry: PolicyRegistry = demoPolicyRegistry;
