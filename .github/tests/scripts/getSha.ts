import child_process from "node:child_process";

export function getSha({
  branch,
  git_dir,
}: {
  branch: string;
  git_dir: string;
}) {
  return child_process
    .execSync(`git rev-parse ${branch}`, {
      cwd: git_dir,
      encoding: "utf8",
    })
    .trim();
}
