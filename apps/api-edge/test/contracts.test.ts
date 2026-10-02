import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaNames = [
  "artifact-version.schema.json",
  "agent-version.schema.json",
  "dependency-reference.schema.json",
  "registry-operation.schema.json",
  "registry-result.schema.json",
] as const;

test("registry contracts are valid JSON schemas with stable v1 identifiers", async () => {
  for (const schemaName of schemaNames) {
    const schema = JSON.parse(await readFile(new URL(`../../../../packages/contracts/v1/${schemaName}`, import.meta.url), "utf8")) as Record<string, unknown>;
    assert.equal(schema["$schema"], "https://json-schema.org/draft/2020-12/schema");
    assert.equal(typeof schema["$id"], "string");
    assert.match(schema["$id"] as string, /\/contracts\/v1\//);
    assert.equal(typeof schema.title, "string");
    assert.equal(schema.type, "object");
  }
});

test("dependency contract requires exactly one version selector", async () => {
  const schema = JSON.parse(await readFile(new URL("../../../../packages/contracts/v1/dependency-reference.schema.json", import.meta.url), "utf8")) as Record<string, unknown>;
  const allOf = schema.allOf as Array<Record<string, unknown>>;
  const oneOf = allOf[0]?.oneOf as Array<Record<string, unknown>>;
  assert.equal(oneOf.length, 2);
  assert.deepEqual(oneOf[0]?.required, ["targetVersion"]);
  assert.deepEqual(oneOf[1]?.required, ["targetVersionConstraint"]);
});
