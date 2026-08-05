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
export const CHANGESET_DESCRIPTION = "__changeset_description__"

export function getActArgs({ gitTmoDir }: { gitTmoDir: string }) {
  return [
    ["-P", `ubuntu-latest=${CUSTOM_ACT_IMAGE}:latest`],
    ["--action-offline-mode"],
    ["--cache-server-path", "/tmp/act-cache"],
    ["--cache-server-addr", "localhost"],
    ["--cache-server-port", "0"],
    ["--use-gitignore"],
    ['--env', 'GITHUB_API_URL=http://host.docker.internal:9999/github/api'],
    ["--var", "DUMMY_GITHUB_TOKEN=dummy-github-token"],
    ["--var", "RELEASE_BOT_CLIENT_ID=some-client-id"],
    ["--var", `RELEASE_BRANCH_NAME=${RELEASE_BRANCH_NAME}`],
    ["--var", `FEATURE_BRANCH_NAME=${FEATURE_BRANCH_NAME}`],
    ["--var", `CHANGESET_DESCRIPTION=${CHANGESET_DESCRIPTION}`],
    ["--secret", `RELEASE_BOT_PRIVATE_KEY=${DUMMY_PRIVATE_KEY}`],
    ["--log-prefix-job-id"],
    ["--json"],
    ["--no-skip-checkout"],
    ["--pull=false"],
    ["--directory", gitTmoDir],
    ['--verbose'],

    /**
     * While macOS Docker Desktop resolves host.docker.internal automatically,
     * Linux Docker hosts require --add-host.
     */
    ["--container-options", `-v ${gitTmoDir}:/host-repo:ro --add-host=host.docker.internal:host-gateway`]
  ];
}