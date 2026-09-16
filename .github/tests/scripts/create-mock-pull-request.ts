import child_process from "node:child_process";

export function createMockPullRequest({
  repo,
  branch,
}: {
  repo: string;
  branch: string;
}) {
  const PR_NUMBER = 10;
  const exec = (args: string[]) =>
    child_process
      .execFileSync("git", args, { cwd: repo, encoding: "utf8" })
      .toString()
      .trim();

  // 1. Compute the 3-way merge tree in-memory between `main` and the feature branch,
  // generating the resulting tree SHA without altering the local working directory.
  const treeSha = exec(["merge-tree", "--write-tree", "main", branch]);

  // 2. Build a synthetic merge commit object from the tree SHA, setting both `main`
  // and `branch` as parent commits (-p) to simulate a real GitHub PR merge commit.
  const commitSha = exec([
    "commit-tree",
    treeSha,
    "-p",
    "main",
    "-p",
    branch,
    "-m",
    `Merge branch ${branch} into main`,
  ]);

  // 3. Register the standard GitHub pull request merge ref (`refs/pull/<id>/merge`)
  // pointing directly to the generated synthetic merge commit.
  exec(["update-ref", `refs/pull/${PR_NUMBER}/merge`, commitSha]);

  // 4. Force-push the PR merge ref to the local bare origin repository so `actions/checkout`
  // can resolve and fetch the ref when running inside the container.
  exec([
    "push",
    "origin",
    `refs/pull/${PR_NUMBER}/merge:refs/pull/${PR_NUMBER}/merge`,
    "--force",
  ]);

  // 5. Update local repo HEAD to the synthetic merge commit. `act` inspects the working
  // copy's current HEAD SHA to auto-populate the `GITHUB_SHA` environment variable.
  exec(["update-ref", "HEAD", commitSha]);

  // Return an event payload matching GitHub's `pull_request` webhook structure
  return {
    action: "opened",
    number: PR_NUMBER,
    pull_request: {
      base: { ref: "main" },
      head: { ref: branch },
      number: PR_NUMBER,
      state: "open",
    },
  } as const;
}
