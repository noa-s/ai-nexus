import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createSignedToken, verifySignedToken } from "../src/auth/signed-token.js";

const secret = "test-secret";
const identity = {
  subject: "user-1",
  principalType: "human" as const,
  tenantId: "tenant-1",
  roles: ["user"],
};

function signedPayload(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

test("round-trips human identity without optional claims", () => {
  const token = createSignedToken(identity, secret, 60, 1_700_000_000_000);
  assert.deepEqual(verifySignedToken(token, secret, 1_700_000_010_000), identity);
  assert.equal(Object.hasOwn(verifySignedToken(token, secret)!, "workloadId"), false);
  assert.equal(Object.hasOwn(verifySignedToken(token, secret)!, "agentId"), false);
});

test("round-trips workload identity", () => {
  const value = { ...identity, principalType: "workload" as const, workloadId: "worker-1" };
  assert.deepEqual(verifySignedToken(createSignedToken(value, secret), secret), value);
});

test("round-trips workload identity with agent context", () => {
  const value = { ...identity, principalType: "workload" as const, workloadId: "worker-1", agentId: "agent-1" };
  assert.deepEqual(verifySignedToken(createSignedToken(value, secret), secret), value);
});

test("rejects wrong secret, malformed token, and expired token", () => {
  const token = createSignedToken(identity, secret, 1, 1_700_000_000_000);
  assert.equal(verifySignedToken(token, "wrong-secret"), null);
  assert.equal(verifySignedToken("not-a-token", secret), null);
  assert.equal(verifySignedToken(token, secret, 1_700_000_002_000), null);
});

test("rejects invalid required and optional claims", () => {
  for (const override of [
    { subject: 123 },
    { tenantId: 123 },
    { roles: "user" },
    { workloadId: "" },
    { agentId: "" },
    { principalType: "agent" },
  ]) {
    assert.equal(verifySignedToken(signedPayload({ ...identity, ...override, exp: 1_700_000_100 }), secret, 1_700_000_000_000), null);
  }
});
