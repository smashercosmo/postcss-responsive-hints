import { setFailed, setOutput, info } from "@actions/core";
import { getExecOutput } from "@actions/exec";

try {
  const changeStatusOutput = (await getExecOutput("pnpm change status")).stdout;

  const hasPendingChangeFiles = !changeStatusOutput
    .toLowerCase()
    .includes("no pending changes");

  info(changeStatusOutput);
  setOutput("has-pending-change-files", hasPendingChangeFiles);

  if (hasPendingChangeFiles) {
    info("Found pending change files.");
  } else {
    info("Could not find pending change files.");
  }
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
