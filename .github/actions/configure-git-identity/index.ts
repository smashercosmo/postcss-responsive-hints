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

  const CURRENT_GIT_CONFIG_COUNT = Number(process.env.GIT_CONFIG_COUNT ?? 0);

  const entries = [
    [
      "http.https://github.com/.extraheader",
      `AUTHORIZATION: basic ${basicAuth}`,
    ],
    ["user.name", appUser],
    ["user.email", `${appId}+${appUser}@users.noreply.github.com`],
  ] as const;

  exportVariable(
    "GIT_CONFIG_COUNT",
    String(CURRENT_GIT_CONFIG_COUNT + entries.length),
  );

  entries.forEach(([key, value], index) => {
    const i = CURRENT_GIT_CONFIG_COUNT + index;

    exportVariable(`GIT_CONFIG_KEY_${i}`, key);
    exportVariable(`GIT_CONFIG_VALUE_${i}`, value);
  });
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message);
  }
}
