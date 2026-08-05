import { getState, warning, info } from "@actions/core";
import { getOctokit } from "@actions/github";

try {
  const octokit = getOctokit(getState("token"));
  await octokit.rest.apps.revokeInstallationAccessToken();
  info("Token revoked");
} catch (error) {
  if (error instanceof Error) {
    warning(error.message);
  }
}
