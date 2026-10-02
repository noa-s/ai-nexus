import { resolve } from "node:path";
import { analyzeRepository } from "./analyzer.js";
import { changedArtifactDeclarations, readRevisionFile, repositoryHeadRevision } from "./git.js";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const repositoryRoot = resolve(argument("--root") ?? process.cwd());
  const repository = argument("--repository") ?? "local/ai-nexus";
  const candidateRevision = argument("--head") ?? repositoryHeadRevision();
  const baseRevision = argument("--base");

  const changes = baseRevision
    ? changedArtifactDeclarations(baseRevision, candidateRevision).map((change) => ({
        ...change,
        baseSource: change.status === "MODIFIED" ? readRevisionFile(baseRevision, change.repositoryPath) : undefined,
      }))
    : [];

  const snapshot = await analyzeRepository(repositoryRoot, { repository, baseRevision, candidateRevision }, { changedArtifacts: changes });
  const blocking = snapshot.findings.filter((finding) => finding.severity === "BLOCKING");

  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
  if (blocking.length > 0) {
    process.stderr.write(`Dependency analysis blocked: ${blocking.length} blocking finding(s).\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`Dependency analysis passed with ${snapshot.findings.length} finding(s).\n`);
}

void main().catch((error) => {
  process.stderr.write(`Dependency analysis failed closed: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
