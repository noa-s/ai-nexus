import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { server } from "../src/server.js";

describe("api-edge", () => {
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
});
