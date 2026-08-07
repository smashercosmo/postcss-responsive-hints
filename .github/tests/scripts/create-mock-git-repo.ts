import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { RELEASE_BRANCH_NAME, FEATURE_BRANCH_NAME } from "../actrc";

const monorepoRoot = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
}).trim();

export function createMockGitRepo({
  originTmpDir,
  repoTmpDir,
}: {
  originTmpDir: string;
  repoTmpDir: string;
}) {
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
    const destPath = path.join(repoTmpDir, relativePath);

    // Skip if source doesn't exist (e.g. deleted staged files)
    if (!fs.existsSync(srcPath)) {
      continue;
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }

  const exec = (cmd: string) => execSync(cmd, { cwd: repoTmpDir });

  // 4. Initialize clean Git repo
  exec("git init -b main");
  exec("git config user.name 'Vladislav Shkodin'");
  exec("git config user.email 'smashercosmo@gmail.com'");
  exec("git add .");
  exec("git commit -m 'initial commit'");
  exec(`git branch ${RELEASE_BRANCH_NAME}`);
  exec(`git branch ${FEATURE_BRANCH_NAME}`);

  exec(`git init --bare "${originTmpDir}"`);
  exec(
    `git config url.${originTmpDir}.insteadOf https://github.com/smashercosmo/postcss-responsive-hints`,
  );
  exec(
    "git remote add origin https://github.com/smashercosmo/postcss-responsive-hints",
  );
  exec("git push origin --all");
}
