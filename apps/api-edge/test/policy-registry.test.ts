import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryPolicyRegistry } from "../src/auth/policy-registry.js";

test("creates, retrieves, and preserves immutable policy versions", () => {
  const registry = new InMemoryPolicyRegistry([]);
  const version = registry.createVersion({
    policyId: "policy.test",
    version: "1",
    lifecycleStatus: "DRAFT",
    content: [{ id: "policy.test", version: "1", effect: "ALLOW", action: "resource.read", target: "resource", priority: 1 }],
  });
  assert.deepEqual(registry.getVersion("policy.test", "1"), version);
  assert.throws(() => registry.createVersion({ ...version, content: [] }));
  assert.deepEqual(registry.getVersion("policy.test", "1")?.content, version.content);
});

test("enforces lifecycle and assignment rules", () => {
  const registry = new InMemoryPolicyRegistry([]);
  registry.createVersion({
    policyId: "policy.test",
    version: "1",
    lifecycleStatus: "DRAFT",
    content: [{ id: "policy.test", version: "1", effect: "ALLOW", action: "resource.read", target: "resource", priority: 1 }],
  });
  assert.throws(() => registry.assign({ consumerType: "service", consumerId: "svc-1", policyId: "policy.test", policyVersion: "1" }));
  registry.transitionLifecycle("policy.test", "1", "ACTIVE");
  const assignment = registry.assign({ consumerType: "service", consumerId: "svc-1", policyId: "policy.test", policyVersion: "1" });
  assert.equal(registry.getAssignmentHistory("service", "svc-1").length, 1);
  const duplicate = registry.assign({ consumerType: "service", consumerId: "svc-1", policyId: "policy.test", policyVersion: "1" });
  assert.deepEqual(duplicate, assignment);
  assert.equal(registry.getAssignmentHistory("service", "svc-1").length, 1);
});

test("allows lifecycle transitions without changing policy content", () => {
  const registry = new InMemoryPolicyRegistry([]);
  const created = registry.createVersion({
    policyId: "policy.test",
    version: "1",
    lifecycleStatus: "DRAFT",
    content: [{ id: "policy.test", version: "1", effect: "ALLOW", action: "resource.read", target: "resource", priority: 1 }],
  });
  const active = registry.transitionLifecycle("policy.test", "1", "ACTIVE");
  assert.deepEqual(active.content, created.content);
  const deprecated = registry.transitionLifecycle("policy.test", "1", "DEPRECATED");
  assert.equal(deprecated.lifecycleStatus, "DEPRECATED");
  assert.deepEqual(deprecated.content, created.content);
});
