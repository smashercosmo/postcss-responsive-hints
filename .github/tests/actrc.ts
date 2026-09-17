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
export const RELEASE_BOT_APP_ID = "__some_app_id__"
export const CACHE_SERVER_PORT = 61_321;

export function getAdditionalArgs({
  remoteRepoTmpDir,
  localRepoTmpDir,
}: {
  remoteRepoTmpDir: string;
  localRepoTmpDir: string;
}) {
  return [
    ["-P", `ubuntu-latest=${CUSTOM_ACT_IMAGE}:latest`],
    ['--pull'],
    ["--verbose"],
    ["--action-offline-mode"],
    ["--no-skip-checkout"],
    ["--directory", localRepoTmpDir],
    ["--container-options", `-v ${remoteRepoTmpDir}:${remoteRepoTmpDir}`],
    ["--container-architecture", `linux/amd64`],
  ].flatMap(item => item);
}

export function getCacheServerArgs() {
  return {
    addr: "0.0.0.0",
    path: "/tmp/act-cache",
    port: CACHE_SERVER_PORT,
    "external-url": `http://host.docker.internal:${CACHE_SERVER_PORT}`,
  };
}

export function getEnvs({ remoteRepoTmpDir }: { remoteRepoTmpDir: string }) {
  return {
    values: {
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: `url.${remoteRepoTmpDir}.insteadOf`,
      GIT_CONFIG_VALUE_0:
        "https://github.com/smashercosmo/postcss-responsive-hints",
      GITHUB_API_URL: "http://host.docker.internal:9999/github/api",
      GITHUB_REPOSITORY: "smashercosmo/postcss-responsive-hints",
    },
  };
}

export function getSecrets() {
  return {
    values: {
      GITHUB_TOKEN: "DUMMY_TOKEN",
      RELEASE_BOT_PRIVATE_KEY: DUMMY_PRIVATE_KEY,
    },
  };
}

export function getVars() {
  return {
    values: {
      RELEASE_BRANCH_NAME,
      FEATURE_BRANCH_NAME,
      RELEASE_BOT_APP_ID,
    }
  }
}
