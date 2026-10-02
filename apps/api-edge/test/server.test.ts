import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSignedToken } from "../src/auth/signed-token.js";
import { server } from "../src/server.js";

const secret = "test-secret";
process.env.AUTH_TOKEN_SECRET = secret;

describe("api-edge server", () => {
  it("serves the health contract", async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "ok", service: "api-edge" });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("rejects the protected route without authentication", async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/protected`);
      assert.equal(response.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("allows a protected request with an authorized identity", async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const token = createSignedToken({
      subject: "user-1",
      principalType: "human",
      tenantId: "tenant-1",
      roles: ["user"],
    }, secret);

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/protected`, {
        headers: { authorization: `Bearer ${token}`, "x-trace-id": "trace-1" },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "ok", service: "api-edge", protected: true });
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
});
