import child_process, { type ExecSyncOptions } from "node:child_process";
import os from "node:os";
import process from "node:process";

export function addPendingChangeFiles({
  branch,
  bump,
  options,
  pkg,
  summary,
}: {
  branch: string;
  bump: string;
  options: ExecSyncOptions;
  pkg: string;
  summary: string;
}) {
  child_process.execSync(`git checkout ${branch}`, options);
  child_process.execSync(
    `pnpm change --bump ${bump} --summary "${summary}" ${pkg}`,
    options,
  );
  child_process.execSync("git add .", options);

  const status = child_process
    .execSync("pnpm change status", options)
    .toString();
  const message = `docs: add pending change intents${os.EOL}${os.EOL}${status}`;
  child_process.execFileSync("git", ["commit", "-m", message], {
    ...options,
    env: { ...process.env },
  });

  child_process.execSync("git checkout main", options);
}
