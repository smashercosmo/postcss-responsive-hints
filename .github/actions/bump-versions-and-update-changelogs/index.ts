import { getInput, setFailed } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

try {
  await exec(`pnpm publish -r --registry ${getInput("private-registry-url")} --no-git-checks --access restricted --filter "@root/*"`);
  const output = await getExecOutput(`pnpm version -r --registry ${getInput("private-registry-url")} --no-git-checks`);
  await exec("git add .");
  const message = `docs: bump versions and update changelogs\n\n${output}`;
  await exec(`git checkout ${getInput("release-branch-name")}"`);
  await exec(`git commit -m "${message}"`);
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
