import child_process from "node:child_process";
import os from "node:os";

export function addPendingChangeFiles({
  branch,
  bump,
  repo,
  pkg,
  summary,
}: {
  branch: string;
  bump: string;
  repo: string;
  pkg: string;
  summary: string;
}) {
  const exec = (command: string, args: string[]) =>
    child_process
      .execFileSync(command, args, { cwd: repo, encoding: "utf8" })
      .toString()
      .trim();

  exec("git", ["checkout", branch]);
  exec("pnpm", ["change", "--bump", bump, "--summary", summary, pkg]);
  exec("git", ["add", "."]);
  const status = exec("pnpm", ["change", "status"])
  const message = `docs: add pending change intents${os.EOL}${os.EOL}${status}`;
  exec("git", ["commit", "-m", message]);
  exec("git", ["checkout", "main"]);
}
