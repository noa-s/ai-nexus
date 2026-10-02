import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { authorize, type AuthorizationPolicySet } from "./authorization.js";
import { recordAuthorizationEvent } from "./audit.js";
import { verifySignedToken } from "./signed-token.js";
import type { AuthorizationRequest, IdentityContext } from "./types.js";

export const demoPolicySet: AuthorizationPolicySet = {
  roles: [
    { name: "user", permissions: [{ action: "resource.read", target: "protected-resource" }] },
    { name: "auditor", permissions: [{ action: "evidence.read", target: "*" }] },
    { name: "service", permissions: [{ action: "service.call", target: "*" }] },
  ],
  policies: [],
};

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
  policySet = demoPolicySet,
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
  recordAuthorizationEvent(identity, result);

  if (result.decision !== "ALLOW") {
    response.writeHead(403, { "content-type": "application/json", "x-request-id": requestId });
    response.end(JSON.stringify({ error: "forbidden", reasonCode: result.reasonCode, decisionId: result.decisionId, requestId }));
    return false;
  }

  return true;
}
