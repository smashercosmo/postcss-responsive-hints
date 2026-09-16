import { ActExecStatus, ActRunner } from "act-test-runner";
import child_process from "node:child_process";
import fs from "node:fs";
import url from "node:url";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

import {
  FEATURE_BRANCH_NAME,
  getAdditionalArgs,
  getCacheServerArgs,
  getEnvs,
  getSecrets,
} from "./actrc";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files";
import { createMockGitRepo } from "./scripts/create-mock-git-repo";
import { server } from "./scripts/create-mock-github-server";
import { createMockPullRequest } from "./scripts/create-mock-pull-request.ts";
import { OutputListener } from "./scripts/output-listener";
import { addEmptyCommit } from './scripts/add-empty-commit.ts'

let tmpDirs: Array<string> = [];
let outputListeners: OutputListener[] = [];
let abourtControllers: AbortController[] = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/check-changes.yml"),
);

beforeAll(() => {
  server.listen({ port: 9999 });
});

afterAll(() => {
  tmpDirs.forEach(tmpDir => {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });
  outputListeners.forEach(listener => {
    listener.clear();
  });
  abourtControllers.forEach(controller => {
    controller.abort();
  });
  server.close();
  tmpDirs.length = 0;
  outputListeners.length = 0;
  abourtControllers.length = 0;
});

describe("Check Changes", () => {
  it("should fail when feature PR does not have generated changesets", async () => {
    const { localRepoTmpDir, remoteRepoTmpDir } = createMockGitRepo();
    tmpDirs.push(localRepoTmpDir);
    tmpDirs.push(remoteRepoTmpDir);

    addEmptyCommit({ repo: localRepoTmpDir, branch: FEATURE_BRANCH_NAME })

    const pullRequestEvent = createMockPullRequest({
      repo: localRepoTmpDir,
      branch: FEATURE_BRANCH_NAME,
    });

    const outputListener = new OutputListener({
      streamOutput: false,
      filter(entry) {
        return (
          entry.step?.name === "failure" && entry.message.includes("::error::")
        );
      },
    });
    outputListeners.push(outputListener);

    const controller = new AbortController();
    abourtControllers.push(controller);

    const { status } = await new ActRunner()
      .withEvent("pull_request", pullRequestEvent)
      .withCacheServer(getCacheServerArgs())
      .withWorkflow({ file: workflowPath })
      .withEnvs(getEnvs({ remoteRepoTmpDir }))
      .withSecrets(getSecrets())
      .withAdditionalArgs(
        ...getAdditionalArgs({
          remoteRepoTmpDir,
          localRepoTmpDir,
        }),
      )
      .forwardOutput(outputListener)
      .run({ signal: controller.signal });

    expect(outputListener.entries.length).toBe(1);
    expect(outputListener.entries[0].message).toBe(
      "No pending change files found in the submitted PR. Please run `pnpm change` and push the generated change files.",
    );
    expect(status).toBe(ActExecStatus.FAILED);
  }, 140_000);
  it("should succeed when feature PR has generated changesets", async () => {
    const { localRepoTmpDir, remoteRepoTmpDir } = createMockGitRepo();
    tmpDirs.push(localRepoTmpDir);
    tmpDirs.push(remoteRepoTmpDir);

    addPendingChangeFiles({
      branch: FEATURE_BRANCH_NAME,
      bump: "major",
      repo: localRepoTmpDir,
      pkg: "postcss-responsive-hints",
      summary: "a lot of breaking changes",
    });

    addPendingChangeFiles({
      branch: FEATURE_BRANCH_NAME,
      bump: "minor",
      repo: localRepoTmpDir,
      pkg: "@root/shared",
      summary: "better code",
    });

    const pullRequestEvent = createMockPullRequest({
      repo: localRepoTmpDir,
      branch: FEATURE_BRANCH_NAME,
    });

    const outputListener = new OutputListener({
      streamOutput: false,
      filter(entry) {
        return (
          entry.step?.name === "success" && entry.message.includes("::notice::")
        );
      },
    });
    outputListeners.push(outputListener);

    const controller = new AbortController();
    abourtControllers.push(controller);

    const { status } = await new ActRunner()
      .withEvent("pull_request", pullRequestEvent)
      .withCacheServer(getCacheServerArgs())
      .withWorkflow({ file: workflowPath })
      .withEnvs(getEnvs({ remoteRepoTmpDir }))
      .withSecrets(getSecrets())
      .withAdditionalArgs(
        ...getAdditionalArgs({
          remoteRepoTmpDir,
          localRepoTmpDir,
        }),
      )
      .forwardOutput(outputListener)
      .run({ signal: controller.signal });

    expect(outputListener.entries.length).toBe(1);
    expect(outputListener.entries[0].message).toBe(
      "Submitted PR contains pending change files. Ready to proceed to the next step.",
    );
    expect(status).toBe(ActExecStatus.SUCCESS);
  }, 140_000);
});
