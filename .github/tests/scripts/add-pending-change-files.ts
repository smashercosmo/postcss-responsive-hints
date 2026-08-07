import child_process from "node:child_process";
import os from "node:os";
import processs from "node:process";

export function addPendingChangeFiles({
  branch,
  bump,
  git_dir,
  pkg,
  summary,
}: {
  branch: string;
  bump: string;
  git_dir: string;
  pkg: string;
  summary: string;
}) {
  const options = { cwd: git_dir, encoding: "utf8" } as const;
  const steps = [
    // 0. Switch to feature or release branch
    `git checkout ${branch}`,
    // 1. Generate pending change file for a package
    `pnpm change --bump ${bump} --summary "${summary}" ${pkg}`,
    // 2. Add generated pending change file
    "git add .",
    // 3. Commit generated file
    {
      command: [
        "git commit -m",
        [
          `"docs: add pending change intents`,
          `${child_process.execSync("pnpm change status", options)}"`,
        ].join(`${os.EOL}${os.EOL}`),
      ].join(" "),
      name: "commit",
    },
    // 3. Switch back to main
    "git checkout main",
    // 4. Push to origin
    "git push origin --all",
  ] as const;

  steps.forEach(step => {
    if (
      typeof step === "object" &&
      step !== null &&
      "name" in step &&
      step.name === "commit"
    ) {
      child_process.execSync(
        step.command,
        Object.assign({}, options, {
          env: {
            ...processs.env,
          },
        }),
      );
    } else if (typeof step === "string") {
      child_process.execSync(step, options);
    }
  });
}
