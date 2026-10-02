import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemaNames = [
  "artifact-version.schema.json",
  "agent-version.schema.json",
  "dependency-reference.schema.json",
  "dependency-node.schema.json",
  "dependency-edge.schema.json",
  "analyzer-finding.schema.json",
  "impact-query.schema.json",
  "ci-enforcement-result.schema.json",
  "registry-operation.schema.json",
  "registry-result.schema.json",
] as const;

test("v1 contracts are valid JSON documents with stable identifiers", async () => {
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

test("dependency edge exposes source and target version identity without database row IDs", async () => {
  const schema = JSON.parse(await readFile(new URL("../../../../packages/contracts/v1/dependency-edge.schema.json", import.meta.url), "utf8")) as Record<string, unknown>;
  const properties = schema.properties as Record<string, unknown>;
  assert.equal((properties.source as Record<string, unknown>)["$ref"], "dependency-node.schema.json");
  assert.equal((properties.target as Record<string, unknown>)["$ref"], "dependency-node.schema.json");
});
