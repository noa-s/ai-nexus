import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRuntimeAction } from "../src/auth/runtime-authorization.js";
import type { AuthorizationPolicySet } from "../src/auth/authorization.js";

const identity = { subject: "user-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["user"] };
const request = { requestId: "runtime-1", tenantId: "tenant-1", action: "resource.read", target: "protected-resource" };
const allowPolicy: AuthorizationPolicySet = {
  roles: [{ name: "user", permissions: [{ action: "resource.read", target: "protected-resource", tenantId: "tenant-1" }] }],
  policies: [{ id: "policy.runtime", version: "1", effect: "ALLOW", action: "resource.read", target: "protected-resource", tenantId: "tenant-1", role: "user", priority: 1 }],
};

test("runtime authorization evaluates its own policy boundary", () => {
  const result = authorizeRuntimeAction(identity, request, allowPolicy, "trace-runtime");
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.traceId, "trace-runtime");
});

test("runtime authorization can deny despite an upstream allow", () => {
  const denyPolicy: AuthorizationPolicySet = {
    roles: allowPolicy.roles,
    policies: [{ id: "policy.runtime-deny", version: "1", effect: "DENY", action: "resource.read", target: "protected-resource", priority: 100 }],
  };
  const result = authorizeRuntimeAction(identity, request, denyPolicy, "trace-runtime");
  assert.equal(result.decision, "DENY");
  assert.equal(result.reasonCode, "POLICY_DENIED");
});
