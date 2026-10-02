import test from "node:test";
import assert from "node:assert/strict";
import { authorize, type AuthorizationPolicySet } from "../src/auth/authorization.js";
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
