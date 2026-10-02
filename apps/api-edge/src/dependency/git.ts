import { execFileSync } from "node:child_process";

export type RepositoryChange = {
  repositoryPath: string;
  status: "ADDED" | "MODIFIED" | "DELETED";
  baseSource?: string;
};

function statusFromGit(value: string): RepositoryChange["status"] {
  if (value === "A") return "ADDED";
  if (value === "D") return "DELETED";
  return "MODIFIED";
}

export function changedArtifactDeclarations(baseRevision: string, candidateRevision: string): readonly RepositoryChange[] {
  const output = execFileSync("git", ["diff", "--name-status", baseRevision, candidateRevision, "--", "*.artifact.ts"], { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...pathParts] = line.split(/\s+/);
      const repositoryPath = pathParts[pathParts.length - 1];
      return { repositoryPath, status: statusFromGit(status) };
    });
}

export function readRevisionFile(revision: string, repositoryPath: string): string | undefined {
  try {
    return execFileSync("git", ["show", `${revision}:${repositoryPath}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return undefined;
  }
}

export function repositoryHeadRevision(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}
