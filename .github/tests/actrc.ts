import { generateKeyPairSync } from "node:crypto";

/** Generate a valid 2048-bit RSA key for tests */
export const DUMMY_PRIVATE_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
}).privateKey;

export const CUSTOM_ACT_IMAGE = "custom-act-image";
export const RELEASE_BRANCH_NAME = "__test_release_branch__";
export const FEATURE_BRANCH_NAME = "__test_feature_branch__";

export function getActArgs({
  originTmpDir,
  repoTmpDir,
}: {
  originTmpDir: string;
  repoTmpDir: string;
}) {
  return [
    ["-P", `ubuntu-latest=${CUSTOM_ACT_IMAGE}:latest`],
    ["--action-offline-mode"],
    ["--cache-server-path", "/tmp/act-cache"],
    ["--cache-server-port", "0"],
    ["--use-gitignore"],
    ["--env", "GITHUB_API_URL=http://host.docker.internal:9999"],
    ["--env", "GIT_CONFIG_COUNT=1"],
    ["--env", `GIT_CONFIG_KEY_0=url.${originTmpDir}.insteadOf`],
    [
      "--env",
      "GIT_CONFIG_VALUE_0=https://github.com/smashercosmo/postcss-responsive-hints",
    ],
    ["--env", "GITHUB_SERVER_URL=https://github.com"],
    ["--env", "GITHUB_REPOSITORY=smashercosmo/postcss-responsive-hints"],
    ["--var", "RELEASE_BOT_APP_ID=some-app-id"],
    ["--var", `RELEASE_BRANCH_NAME=${RELEASE_BRANCH_NAME}`],
    ["--var", `FEATURE_BRANCH_NAME=${FEATURE_BRANCH_NAME}`],
    ["--secret", `RELEASE_BOT_PRIVATE_KEY=${DUMMY_PRIVATE_KEY}`],
    ["--secret", "GITHUB_TOKEN=dummy-local-token"],
    ["--log-prefix-job-id"],
    ["--json"],
    ["--no-skip-checkout"],
    ["--pull=false"],
    ["--verbose"],
    ["--directory", repoTmpDir],
    ["--container-options", `-v ${originTmpDir}:${originTmpDir}`],
  ];
}
