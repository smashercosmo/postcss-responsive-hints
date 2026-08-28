import { getInput, setFailed, setOutput } from "@actions/core";
import { exec, getExecOutput } from "@actions/exec";

try {
  await exec(
    "pnpm",
    [
      "publish",
      "-r",
      "--registry",
      getInput("private-registry-url"),
      "--no-git-checks",
      "--access",
      "restricted",
      "--filter",
      `"@root/*"`,
    ],
    {
      env: {
        ...process.env,
        // to silence OIDC warnings
        GITHUB_ACTIONS: "false",
      },
    },
  );

  const { stdout: status } = await getExecOutput("pnpm", [
    "version",
    "-r",
    "--registry",
    getInput("private-registry-url"),
    "--no-git-checks",
  ]);

  await exec("git", ["add", "."]);

  const message = `docs: bump versions and update changelogs\n\n${status.trim()}`;

  await exec("git", ["checkout", getInput("release-branch-name")]);

  await exec("git", ["commit", "-m", message]);

  setOutput("status", status.trim());
} catch (error) {
  if (error instanceof Error) {
    setFailed(`Action failed: ${error.message}`);
  }
}
