import assert from "node:assert/strict";
import test from "node:test";
import { createSignedToken } from "../src/auth/signed-token.js";
import { requireAuthorization } from "../src/auth/middleware.js";
import { InMemoryAuditEventStore } from "../src/auth/audit.js";

const secret = "test-secret";
process.env.AUTH_TOKEN_SECRET = secret;
const identity = { subject: "user-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["user"] };

function request(authorization?: string): any {
  return { headers: authorization ? { authorization } : {} };
}
function createResponse() {
  const result = { statusCode: 0, body: "" };
  return {
    result,
    response: {
      writeHead(statusCode: number) { result.statusCode = statusCode; return this; },
      end(body?: string) { result.body = body ?? ""; },
    } as any,
  };
}

test("rejects missing and malformed authorization headers", () => {
  for (const authorization of [undefined, "Basic abc"]) {
    const { result, response } = createResponse();
    assert.equal(requireAuthorization(request(authorization), response, "resource.read", "protected-resource", () => { throw new Error("unused"); }, new InMemoryAuditEventStore()), false);
    assert.equal(result.statusCode, 401);
  }
});

test("rejects invalid signed tokens", () => {
  const { result, response } = createResponse();
  assert.equal(requireAuthorization(request("Bearer invalid"), response, "resource.read", "protected-resource", () => { throw new Error("unused"); }, new InMemoryAuditEventStore()), false);
  assert.equal(result.statusCode, 401);
});

test("allows an authorized request", () => {
  const token = createSignedToken(identity, secret);
  const { result, response } = createResponse();
  assert.equal(requireAuthorization(request(`Bearer ${token}`), response, "resource.read", "protected-resource", () => ({
    roles: [{ name: "user", permissions: [{ action: "resource.read", target: "protected-resource", tenantId: "tenant-1" }] }],
    policies: [{ id: "policy.read", version: "1", effect: "ALLOW", action: "resource.read", target: "protected-resource", tenantId: "tenant-1", role: "user", priority: 1 }],
  }), new InMemoryAuditEventStore()), true);
  assert.equal(result.statusCode, 0);
});

test("denies an unauthorized request", () => {
  const token = createSignedToken(identity, secret);
  const { result, response } = createResponse();
  assert.equal(requireAuthorization(request(`Bearer ${token}`), response, "resource.delete", "protected-resource", () => ({ roles: [], policies: [] }), new InMemoryAuditEventStore()), false);
  assert.equal(result.statusCode, 403);
});

test("fails closed when policy lookup fails", () => {
  const token = createSignedToken(identity, secret);
  const { result, response } = createResponse();
  assert.equal(requireAuthorization(request(`Bearer ${token}`), response, "resource.read", "protected-resource", () => { throw new Error("policy unavailable"); }, new InMemoryAuditEventStore()), false);
  assert.equal(result.statusCode, 503);
});
