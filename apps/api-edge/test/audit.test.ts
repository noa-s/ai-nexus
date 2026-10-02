import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryAuditEventStore, readAuthorizationEvents, recordAuthorizationEvent } from "../src/auth/audit.js";
import { authorize, type AuthorizationPolicySet } from "../src/auth/authorization.js";

const policySet: AuthorizationPolicySet = {
  roles: [{ name: "user", permissions: [{ action: "resource.read", target: "resource", tenantId: "tenant-1" }] }, { name: "auditor", permissions: [{ action: "evidence.read", target: "authorization-events", tenantId: "tenant-1" }] }],
  policies: [{ id: "policy.read", version: "1", effect: "ALLOW", action: "resource.read", target: "resource", tenantId: "tenant-1", role: "user", priority: 1 }],
};
const identity = { subject: "user-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["user"] };
const auditor = { subject: "auditor-1", principalType: "human" as const, tenantId: "tenant-1", roles: ["auditor"] };

test("records authorization context and policy versions", () => {
  const store = new InMemoryAuditEventStore();
  const decision = authorize(identity, { requestId: "request-1", tenantId: "tenant-1", actor: "user-1", action: "resource.read", target: "resource" }, policySet, "trace-1");
  const event = recordAuthorizationEvent(identity, decision, store);
  assert.equal(event.eventType, "AUTHORIZATION_DECISION");
  assert.equal(event.action, "resource.read");
  assert.equal(event.target, "resource");
  assert.deepEqual(event.policyVersions, ["policy.read@1"]);
  assert.equal(event.traceId, "trace-1");
});

test("auditor reads are tenant scoped and generate an auditable read event", () => {
  const store = new InMemoryAuditEventStore();
  const decision = authorize(identity, { requestId: "request-2", tenantId: "tenant-1", actor: "user-1", action: "resource.read", target: "resource" }, policySet);
  recordAuthorizationEvent(identity, decision, store);
  assert.equal(readAuthorizationEvents(auditor, policySet, store).length, 1);
  assert.equal(store.listByTenant("tenant-1").filter((event) => event.eventType === "AUDIT_READ").length, 1);
  assert.equal(readAuthorizationEvents({ ...auditor, tenantId: "tenant-2" }, policySet, store).length, 0);
});

test("workload auditor can read authorized evidence", () => {
  const store = new InMemoryAuditEventStore();
  const decision = authorize(identity, { requestId: "request-3", tenantId: "tenant-1", actor: "user-1", action: "resource.read", target: "resource" }, policySet);
  recordAuthorizationEvent(identity, decision, store);
  const workloadAuditor = { ...auditor, principalType: "workload" as const, workloadId: "auditor-worker" };
  assert.equal(readAuthorizationEvents(workloadAuditor, policySet, store).length, 1);
});
