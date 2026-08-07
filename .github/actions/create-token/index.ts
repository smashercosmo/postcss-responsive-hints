import {
  getInput,
  setOutput,
  saveState,
  error,
  info,
  setFailed,
} from "@actions/core";
import { getOctokit, context } from "@actions/github";
import { createAppAuth } from "@octokit/auth-app";

try {
  const appId = getInput("app-id", { required: true });
  const privateKey = getInput("private-key", { required: true });
  const permissionsContents = getInput("permissions-contents");
  const permissionsPullRequests = getInput("permissions-pull-requests");

  const permissionValues = new Set(["read", "write"]);

  const permissions: {
    contents: "read" | "write";
    pull_requests: "read" | "write";
  } = {
    contents: "read",
    pull_requests: "read",
  };

  function isCorrectPermission(
    permission: string,
  ): permission is "read" | "write" {
    return permissionValues.has(permission);
  }

  if (permissionsContents && !permissionValues.has(permissionsContents)) {
    error("permissions-pull-requests value can be only `read` or `write`");
  }

  if (
    permissionsPullRequests &&
    !permissionValues.has(permissionsPullRequests)
  ) {
    error("permissions-pull-requests value can be only `read` or `write`");
  }

  if (isCorrectPermission(permissionsContents)) {
    permissions.contents = permissionsContents;
  }

  if (isCorrectPermission(permissionsPullRequests)) {
    permissions.pull_requests = permissionsPullRequests;
  }

  const appAuth = createAppAuth({
    appId,
    privateKey,
  });

  const authentication = await appAuth({ type: "app" });
  const octokit = getOctokit(authentication.token);

  const { data: installation } = await octokit.rest.apps.getRepoInstallation({
    ...context.repo,
  });

  const { data } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installation.id,
    permissions,
  });

  info("Token created successfully");
  saveState("token", data.token);
  setOutput("app-slug", installation.app_slug);
  setOutput("token", data.token);
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
