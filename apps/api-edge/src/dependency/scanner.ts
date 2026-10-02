import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import type { AgentArtifactDeclaration } from "../registry/types.js";

const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const ARTIFACT_FILE_PATTERN = /\.artifact\.ts$/;

export type ParsedArtifactDeclaration = {
  repositoryPath: string;
  absolutePath: string;
  declaration: AgentArtifactDeclaration;
};

export type ScannerFailure = {
  repositoryPath: string;
  message: string;
  line?: number;
  column?: number;
};

export type ScanResult = {
  declarations: readonly ParsedArtifactDeclaration[];
  failures: readonly ScannerFailure[];
};

function unwrapExpression(node: ts.Expression): ts.Expression {
  let current = node;
  while (true) {
    if (ts.isParenthesizedExpression(current) || ts.isSatisfiesExpression(current) || ts.isAsExpression(current) || ts.isNonNullExpression(current)) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

function propertyName(node: ts.PropertyName): string {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  throw new Error("computed or unsupported property names are not allowed");
}

function literalValue(node: ts.Expression): unknown {
  const expression = unwrapExpression(node);

  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
  if (ts.isNumericLiteral(expression)) return Number(expression.text);
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (expression.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map((element) => {
      if (ts.isSpreadElement(element)) throw new Error("spread elements are not allowed in artifact declarations");
      return literalValue(element);
    });
  }

  if (ts.isObjectLiteralExpression(expression)) {
    const result: Record<string, unknown> = {};
    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) throw new Error("shorthand, method, accessor, and spread properties are not allowed");
      const key = propertyName(property.name);
      result[key] = literalValue(property.initializer);
    }
    return result;
  }

  throw new Error(`unsupported non-literal declaration expression: ${ts.SyntaxKind[expression.kind]}`);
}

function findExportedDeclaration(sourceFile: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (!isExported) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (!declaration.initializer) continue;
        const candidate = unwrapExpression(declaration.initializer);
        if (ts.isObjectLiteralExpression(candidate)) return candidate;
      }
    }

    if (ts.isExportAssignment(statement) && ts.isExpression(statement.expression)) {
      const candidate = unwrapExpression(statement.expression);
      if (ts.isObjectLiteralExpression(candidate)) return candidate;
    }
  }
  return undefined;
}

function location(sourceFile: ts.SourceFile, node: ts.Node): { line: number; column: number } {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: position.line + 1, column: position.character + 1 };
}

function validateDeclaration(value: unknown): AgentArtifactDeclaration {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("artifact declaration must be an object");
  const declaration = value as Record<string, unknown>;
  if (declaration.schemaVersion !== "1") throw new Error("unsupported declaration schema version");
  if (declaration.artifactType !== "agent") throw new Error("only agent artifact declarations are supported in v1");
  for (const field of ["artifactId", "version", "agentId", "dependencies", "policyReferences", "capabilityMetadata"]) {
    if (!(field in declaration)) throw new Error(`missing required declaration field: ${field}`);
  }
  if (typeof declaration.artifactId !== "string" || typeof declaration.version !== "string" || typeof declaration.agentId !== "string") {
    throw new Error("artifact identity fields must be strings");
  }
  if (declaration.artifactId !== declaration.agentId) throw new Error("artifactId and agentId must match for an Agent declaration");
  if (!Array.isArray(declaration.dependencies) || !Array.isArray(declaration.policyReferences)) throw new Error("dependencies and policyReferences must be arrays");
  if (!declaration.capabilityMetadata || typeof declaration.capabilityMetadata !== "object" || Array.isArray(declaration.capabilityMetadata)) throw new Error("capabilityMetadata must be an object");
  return declaration as unknown as AgentArtifactDeclaration;
}

function discoverFiles(root: string): string[] {
  const result: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
        visit(join(directory, entry.name));
        continue;
      }
      if (entry.isFile() && ARTIFACT_FILE_PATTERN.test(entry.name)) result.push(join(directory, entry.name));
    }
  };
  visit(root);
  return result.sort((a, b) => relative(root, a).localeCompare(relative(root, b)));
}

export function scanArtifactDeclarations(repositoryRoot: string): ScanResult {
  const declarations: ParsedArtifactDeclaration[] = [];
  const failures: ScannerFailure[] = [];

  for (const absolutePath of discoverFiles(repositoryRoot)) {
    const repositoryPath = relative(repositoryRoot, absolutePath).split("\\").join("/");
    let sourceText: string;
    try {
      sourceText = readFileSync(absolutePath, "utf8");
    } catch (error) {
      failures.push({ repositoryPath, message: `unable to read artifact declaration: ${String(error)}` });
      continue;
    }

    const sourceFile = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const exported = findExportedDeclaration(sourceFile);
    if (!exported) {
      failures.push({ repositoryPath, message: "no statically inspectable exported object declaration found" });
      continue;
    }

    try {
      const declaration = validateDeclaration(literalValue(exported));
      declarations.push({ repositoryPath, absolutePath, declaration });
    } catch (error) {
      const position = location(sourceFile, exported);
      failures.push({ repositoryPath, message: String(error instanceof Error ? error.message : error), line: position.line, column: position.column });
    }
  }

  return { declarations, failures };
}

export function parseArtifactDeclarationText(sourceText: string, repositoryPath = "fixture.artifact.ts"): AgentArtifactDeclaration {
  const sourceFile = ts.createSourceFile(repositoryPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const exported = findExportedDeclaration(sourceFile);
  if (!exported) throw new Error("no statically inspectable exported object declaration found");
  return validateDeclaration(literalValue(exported));
}

export function artifactFileExists(repositoryRoot: string, repositoryPath: string): boolean {
  try {
    return statSync(join(repositoryRoot, repositoryPath)).isFile();
  } catch {
    return false;
  }
}
