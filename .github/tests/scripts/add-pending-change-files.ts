import child_process, { type ExecFileSyncOptions } from "node:child_process";
import os from "node:os";

export function addPendingChangeFiles({
  branch,
  bump,
  options,
  pkg,
  summary,
}: {
  branch: string;
  bump: string;
  options: ExecFileSyncOptions;
  pkg: string;
  summary: string;
}) {
  child_process.execFileSync("git", ["checkout", branch], options);
  child_process.execFileSync(
    "pnpm",
    ["change", "--bump", bump, "--summary", summary, pkg],
    options,
  );
  child_process.execFileSync("git", ["add", "."], options);

  const status = child_process
    .execFileSync("pnpm", ["change", "status"], options)
    .toString()
    .trim();

  const message = `docs: add pending change intents${os.EOL}${os.EOL}${status}`;

  child_process.execFileSync("git", ["commit", "-m", message], options);
  child_process.execFileSync("git", ["checkout", "main"], options);
}
