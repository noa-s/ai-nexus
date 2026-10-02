import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const contractPath = (name: string) => fileURLToPath(new URL(`../../../packages/contracts/v1/${name}`, import.meta.url));

const readSchema = (name: string): Record<string, unknown> => JSON.parse(readFileSync(contractPath(name), "utf8"));

test("registry contracts are valid JSON Schema documents", () => {
  for (const name of ["artifact-registry.schema.json", "agent-registry.schema.json", "registry-operation.schema.json"]) {
    const schema = readSchema(name);
    assert.equal(schema["$schema"], "https://json-schema.org/draft/2020-12/schema");
    assert.equal((schema["properties"] as Record<string, unknown>).schemaVersion && ((schema["properties"] as Record<string, Record<string, unknown>>).schemaVersion.const), "1");
  }
});

test("agent contract exposes the required dependency and policy reference shapes", () => {
  const schema = readSchema("agent-registry.schema.json");
  const defs = schema["$defs"] as Record<string, Record<string, unknown>>;
  assert.deepEqual(defs.policyReference.required, ["policyId", "policyVersion", "policyType", "relationship", "context"]);
  assert.ok(defs.dependencyReference.oneOf);
  assert.deepEqual(defs.dependencyReference.oneOf, [{ required: ["targetVersion"] }, { required: ["targetVersionConstraint"] }]);
});
