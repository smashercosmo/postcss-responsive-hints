import { getInput, exportVariable, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";
import { Buffer } from "node:buffer";

try {
  const appSlug = getInput("app-slug", { required: true });
  const token = getInput("token", { required: true });

  const appUser = `${appSlug}[bot]`;
  const basicAuth = Buffer.from(`x-access-token:${token}`).toString("base64");
  const octokit = getOctokit(token, { baseUrl: context.apiUrl });
  const {
    data: { id: appId },
  } = await octokit.rest.users.getByUsername({
    username: appUser,
  });

  exportVariable("GIT_CONFIG_COUNT", 3);
  exportVariable("GIT_CONFIG_KEY_0", "http.https://github.com/.extraheader");
  exportVariable("GIT_CONFIG_VALUE_0", `AUTHORIZATION: basic ${basicAuth}`);
  exportVariable("GIT_CONFIG_KEY_1", "user.name");
  exportVariable("GIT_CONFIG_VALUE_1", appUser);
  exportVariable("GIT_CONFIG_KEY_2", "user.email");
  exportVariable(
    "GIT_CONFIG_VALUE_2",
    `${appId}+${appUser}@users.noreply.github.com`,
  );
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
