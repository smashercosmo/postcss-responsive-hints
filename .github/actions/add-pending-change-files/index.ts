import { getInput, setFailed } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

try {
  const branchName = getInput("branch-name", { required: true });
  const changeFileSummary = getInput("change-file-summary", {
    required: true,
  });

  // 1. Define tmp worktree path
  const worktree = "../tmp-worktree";

  async function generateAndCommitPendingChangeFile({
    bump,
    pkg,
  }: {
    bump: "major" | "minor" | "patch";
    pkg: string;
  }) {
    // 2. Generate pending change file
    await exec(
      `pnpm change ${pkg} --bump ${bump} --summary "${changeFileSummary}"`,
    );

    // 3. Let's create git worktree as I don't want to change branches
    await exec(`git worktree add -B ${branchName} ${worktree}`);

    // 4. Move to the worktree directory
    await exec(`cd ${worktree}`);

    // 5. Add generated pending change file
    await exec(`git add .`);

    // 6. Commit generated file
    const changeStatus = (await getExecOutput("pnpm change status")).stdout;
    const commitMessage = `docs: add pending change intents\n\n${changeStatus}`;
    await exec(`git commit -m "${commitMessage}"`);

    // 6. Go back to main repo
    await exec(`cd -`);

    // 7. Remove temporary worktree
    await exec(`git worktree remove ${worktree}`);
  }

  await generateAndCommitPendingChangeFile({
    bump: "major",
    pkg: "postcss-responsive-hints",
  });
  await generateAndCommitPendingChangeFile({ bump: "minor", pkg: "@root/lefthook" });
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
