import { generateKeyPairSync } from "node:crypto";

/** Generate a valid 2048-bit RSA key for tests */
export const DUMMY_PRIVATE_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { format: "pem", type: "pkcs8" },
  publicKeyEncoding: { format: "pem", type: "spki" },
}).privateKey;

export const CUSTOM_ACT_IMAGE = "custom-act-image";
export const RELEASE_BRANCH_NAME = "__test_release_branch__"
export const FEATURE_BRANCH_NAME = "__test_feature_branch__"
export const CHANGE_FILE_SUMMARY = "__change_file_summary__"

export function getActArgs({ gitTmpDir }: { gitTmpDir: string }) {
  return [
    ["-P", `ubuntu-latest=${CUSTOM_ACT_IMAGE}:latest`],
    ["--action-offline-mode"],
    ["--cache-server-path", "/tmp/act-cache"],
    ["--cache-server-port", "0"],
    ["--use-gitignore"],
    ['--env', 'GITHUB_API_URL=http://host.docker.internal:9999/github/api'],
    ["--var", "DUMMY_GITHUB_TOKEN=dummy-github-token"],
    ["--var", "RELEASE_BOT_APP_ID=some-app-id"],
    ["--var", `RELEASE_BRANCH_NAME=${RELEASE_BRANCH_NAME}`],
    ["--var", `FEATURE_BRANCH_NAME=${FEATURE_BRANCH_NAME}`],
    ["--var", `CHANGE_FILE_SUMMARY=${CHANGE_FILE_SUMMARY}`],
    ["--secret", `RELEASE_BOT_PRIVATE_KEY=${DUMMY_PRIVATE_KEY}`],
    ["--log-prefix-job-id"],
    ["--json"],
    ["--no-skip-checkout"],
    ["--pull=false"],
    ["--directory", gitTmpDir],
    ['--verbose'],

    /**
     * While macOS Docker Desktop resolves host.docker.internal automatically,
     * Linux Docker hosts require --add-host.
     */
    ["--container-options", `-v ${gitTmpDir}:/host-repo:ro --add-host=host.docker.internal:host-gateway`]
  ];
}