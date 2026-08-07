import { getInput, setFailed } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

try {
  const branchName = getInput("branch-name", { required: true });
  await exec(`git checkout -B ${branchName}`);
  const output = (await getExecOutput("pnpm version -r")).stdout;
  await exec("git add .");
  const commitMessage = `docs: bump versions and update changelogs\n\n${output}`;
  await exec(`git commit -m "${commitMessage}"`);
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
