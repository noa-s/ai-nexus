import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  authorize,
  authorizeServiceCall,
  type AuthorizationPolicySet,
} from "../src/auth/authorization.js";
import {
  InMemoryAuditEventStore,
  readAuthorizationEvents,
  recordAuthorizationEvent,
} from "../src/auth/audit.js";
import { requireAuthorization } from "../src/auth/middleware.js";
import { InMemoryPolicyRegistry, demoPolicyRegistry } from "../src/auth/policy-registry.js";
import { authorizeRuntimeAction } from "../src/auth/runtime-authorization.js";
import { createSignedToken, verifySignedToken } from "../src/auth/signed-token.js";

const secret = "test-secret";
const identity = {
  subject: "user-1",
  principalType: "human" as const,
  tenantId: "tenant-1",
  roles: ["user"],
};

const policies: AuthorizationPolicySet = {
  roles: [{ name: "user", permissions: [{ action: "resource.read", target: "protected-resource", tenantId: "tenant-1" }] }],
  policies: [{ id: "policy.resource-read", version: "1", effect: "ALLOW", action: "resource.read", target: "protected-resource", tenantId: "tenant-1", role: "user", priority: 10 }],
};

test("signed identity token round-trips without exposing a secret", () => {
  const token = createSignedToken(identity, secret, 60, 1_700_000_000_000);
  assert.notEqual(token, secret);
  assert.deepEqual(verifySignedToken(token, secret, 1_700_000_010_000), identity);
  assert.equal(verifySignedToken(token, "wrong-secret", 1_700_000_010_000), null);
});

test("signed workload identity token preserves workloadId and omits absent agentId", () => {
  const workloadIdentity = {
    ...identity,
    principalType: "workload" as const,
    workloadId: "worker-1",
  };
  const token = createSignedToken(workloadIdentity, secret, 60, 1_700_000_000_000);
  const verified = verifySignedToken(token, secret, 1_700_000_010_000);

  assert.deepEqual(verified, workloadIdentity);
  assert.equal(Object.hasOwn(verified!, "agentId"), false);
});

test("signed workload identity with agent context preserves agentId and omits absent workloadId", () => {
  const agentIdentity = {
    ...identity,
    principalType: "workload" as const,
    agentId: "agent-1",
  };
  const token = createSignedToken(agentIdentity, secret, 60, 1_700_000_000_000);
  const verified = verifySignedToken(token, secret, 1_700_000_010_000);

  assert.deepEqual(verified, agentIdentity);
  assert.equal(Object.hasOwn(verified!, "workloadId"), false);
});

test("signed tokens reject unsupported principal types", () => {
  const encodedPayload = Buffer.from(JSON.stringify({
    ...identity,
    principalType: "agent",
    exp: 1_700_000_100,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");

  assert.equal(verifySignedToken(`${encodedPayload}.${signature}`, secret, 1_700_000_000_000), null);
});

test("authorization allows matching RBAC and policy constraints", () => {
  const result = authorize(identity, {
    requestId: "request-1",
    actor: identity.subject,
    tenantId: identity.tenantId,
    action: "resource.read",
    target: "protected-resource",
  }, policies, "trace-1");

  assert.equal(result.decision, "ALLOW");
  assert.deepEqual(result.policyVersions, ["policy.resource-read@1"]);
  assert.equal(result.traceId, "trace-1");
});

test("authorization denies cross-tenant requests", () => {
  const result = authorize(identity, {
    requestId: "request-2",
    actor: identity.subject,
    tenantId: "tenant-2",
    action: "resource.read",
    target: "protected-resource",
  }, policies);

  assert.equal(result.decision, "DENY");
  assert.equal(result.reasonCode, "TENANT_SCOPE_DENIED");
});

test("authorization denies a missing permission", () => {
  const result = authorize(identity, {
    requestId: "request-3",
    actor: identity.subject,
    tenantId: identity.tenantId,
    action: "resource.delete",
    target: "protected-resource",
  }, policies);

  assert.equal(result.decision, "DENY");
  assert.equal(result.reasonCode, "RBAC_DENIED");
});

test("a higher-priority deny overrides an allow", () => {
  const result = authorize(identity, {
    requestId: "request-4",
    actor: identity.subject,
    tenantId: identity.tenantId,
    action: "resource.read",
    target: "protected-resource",
  }, {
    ...policies,
    policies: [
      ...policies.policies,
      { id: "policy.security", version: "7", effect: "DENY", action: "resource.read", target: "protected-resource", tenantId: "tenant-1", priority: 100 },
    ],
  });

  assert.equal(result.decision, "DENY");
  assert.equal(result.reasonCode, "POLICY_DENIED");
  assert.deepEqual(result.policyVersions, ["policy.security@7"]);
});

test("policy registry preserves immutable content while allowing lifecycle transitions", () => {
  const registry = new InMemoryPolicyRegistry([
    { name: "user", permissions: [{ action: "resource.read", target: "resource" }] },
  ]);
  const draft = registry.createVersion({
    policyId: "policy.test",
    version: "1",
    lifecycleStatus: "DRAFT",
    content: [{ id: "policy.test", version: "1", effect: "ALLOW", action: "resource.read", target: "resource", priority: 1 }],
  });

  assert.throws(() => registry.assign({ consumerType: "service", consumerId: "test", policyId: "policy.test", policyVersion: "1" }));
  const active = registry.transitionLifecycle("policy.test", "1", "ACTIVE");
  assert.deepEqual(active.content, draft.content);
  registry.assign({ consumerType: "service", consumerId: "test", policyId: "policy.test", policyVersion: "1" });
  assert.equal(registry.getAssignmentHistory("service", "test").length, 1);
  assert.throws(() => registry.createVersion({
    policyId: "policy.test",
    version: "1",
    lifecycleStatus: "ACTIVE",
    content: [],
  }));
  assert.deepEqual(registry.getVersion("policy.test", "1")?.content, draft.content);
});

test("service-to-service authorization requires a workload identity and explicit target", () => {
  const policySet = demoPolicyRegistry.getAuthorizationPolicySet("service", "api-edge");
  const workloadIdentity = {
    subject: "worker-1",
    principalType: "workload" as const,
    tenantId: "tenant-1",
    roles: ["service"],
    workloadId: "worker-1",
  };
  const allowed = authorizeServiceCall(workloadIdentity, "policy-registry", "service.call", policySet, "service-request");
  assert.equal(allowed.decision, "ALLOW");

  const spoofedHuman = { ...identity, roles: ["service"], workloadId: "worker-1" };
  const denied = authorizeServiceCall(spoofedHuman, "policy-registry", "service.call", policySet, "service-request-2");
  assert.equal(denied.decision, "DENY");
  assert.equal(denied.reasonCode, "WORKLOAD_IDENTITY_REQUIRED");
});

test("Auditor can read tenant-scoped evidence and the read is itself auditable", () => {
  const store = new InMemoryAuditEventStore();
  const decision = authorize(identity, {
    requestId: "request-audit-source",
    actor: identity.subject,
    tenantId: identity.tenantId,
    action: "resource.read",
    target: "protected-resource",
  }, policies);
  recordAuthorizationEvent(identity, decision, store);

  const auditor = {
    subject: "auditor-1",
    principalType: "human" as const,
    tenantId: "tenant-1",
    roles: ["auditor"],
  };
  const evidence = readAuthorizationEvents(auditor, demoPolicyRegistry.getAuthorizationPolicySet("service", "api-edge"), store, "audit-trace");
  assert.equal(evidence.length, 1);
  assert.equal(store.listByTenant("tenant-1").some((event) => event.eventType === "AUDIT_READ"), true);

  const workloadAuditor = {
    subject: "auditor-worker",
    principalType: "workload" as const,
    tenantId: "tenant-1",
    roles: ["auditor"],
    workloadId: "auditor-worker",
  };
  assert.equal(readAuthorizationEvents(workloadAuditor, demoPolicyRegistry.getAuthorizationPolicySet("service", "api-edge"), store).length, 2);

  const otherTenant = { ...auditor, tenantId: "tenant-2" };
  assert.equal(readAuthorizationEvents(otherTenant, demoPolicyRegistry.getAuthorizationPolicySet("service", "api-edge"), store).length, 0);
});

test("downstream runtime authorization does not trust an upstream allow", () => {
  const upstream = authorize(identity, {
    requestId: "request-runtime",
    tenantId: identity.tenantId,
    action: "resource.read",
    target: "protected-resource",
  }, policies);
  assert.equal(upstream.decision, "ALLOW");

  const downstreamPolicy: AuthorizationPolicySet = {
    roles: policies.roles,
    policies: [{ id: "policy.runtime-deny", version: "1", effect: "DENY", action: "resource.read", target: "protected-resource", priority: 100 }],
  };
  const downstream = authorizeRuntimeAction(identity, {
    requestId: "request-runtime",
    tenantId: identity.tenantId,
    action: "resource.read",
    target: "protected-resource",
  }, downstreamPolicy, "trace-runtime");
  assert.equal(downstream.decision, "DENY");
});

test("protected authorization fails closed when the policy dependency is unavailable", () => {
  const token = createSignedToken(identity, secret);
  const request = {
    headers: { authorization: `Bearer ${token}` },
  } as unknown as IncomingMessage;
  const result = { statusCode: 0, body: "" };
  const response = {
    writeHead(statusCode: number) {
      result.statusCode = statusCode;
      return this;
    },
    end(body?: string) {
      result.body = body ?? "";
    },
  } as unknown as ServerResponse;

  assert.equal(requireAuthorization(request, response, "resource.read", "protected-resource", () => {
    throw new Error("policy registry unavailable");
  }, new InMemoryAuditEventStore()), false);
  assert.equal(result.statusCode, 503);
  assert.match(result.body, /authorization_unavailable/);
});
