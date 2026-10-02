import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { server } from "../src/server.js";

describe("api-edge", () => {
  it("creates an executable HTTP server", () => {
    assert.equal(typeof server.listen, "function");
    assert.equal(typeof server.close, "function");
  });
});
