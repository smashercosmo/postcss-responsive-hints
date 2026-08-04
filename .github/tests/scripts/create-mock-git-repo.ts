import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const monorepoRoot = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();

export function createMockGitRepo(gitTmpDir: string) {
  // 1. Get tracked + untracked (non-ignored) files delimited by null byte (\0)
  const filesOutput = execSync(
    "git ls-files --cached --others --exclude-standard -z",
    { cwd: monorepoRoot },
  );

  // 2. Parse filenames safely
  const files = filesOutput.toString("utf8").split("\0").filter(Boolean);

  // 3. Copy each file into the temp directory
  for (const relativePath of files) {
    const srcPath = path.join(monorepoRoot, relativePath);
    const destPath = path.join(gitTmpDir, relativePath);

    // Skip if source doesn't exist (e.g. deleted staged files)
    if (!fs.existsSync(srcPath)) {
      continue;
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }

  const exec = (cmd: string) => execSync(cmd, { cwd: gitTmpDir, stdio: "ignore" });

  // 4. Initialize clean Git repo
  exec("git init -b main");
  exec("git config user.name 'Act Test Runner'");
  exec("git config user.email 'test@example.com'");
  exec("git remote add origin https://github.com/smashercosmo/postcss-responsive-hints.git");

  exec("git add .");
  exec("git commit -m 'initial monorepo commit'");
}
