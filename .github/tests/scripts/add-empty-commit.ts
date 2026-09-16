import child_process from "node:child_process";

export function addEmptyCommit({
  repo,
  branch,
}: {
  repo: string;
  branch: string;
}) {
  child_process.execFileSync("git", ["checkout", branch], {
    cwd: repo,
  });
  child_process.execFileSync(
    "git",
    ["commit", "-m", "Empty commit", "--allow-empty"],
    {
      cwd: repo,
    },
  );
}
