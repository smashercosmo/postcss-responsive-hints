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
const CACHE_SERVER_PORT = 61_321;

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
    ["--network", "bridge"],
    [
      "--cache-server-external-url",
      `http://host.docker.internal:${CACHE_SERVER_PORT}`,
    ],
    ["--use-gitignore"],
/*    ["--json"],*/
    ["--pull"],
    ["--verbose"],
    ["--no-skip-checkout"],
    ["--directory", repoTmpDir],
    ["--container-options", `-v ${originTmpDir}:${originTmpDir}`],
    ["--container-architecture", `linux/amd64`],
  ];
}
