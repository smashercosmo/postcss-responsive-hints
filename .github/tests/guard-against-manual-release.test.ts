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
  getSecrets, getVars,
  RELEASE_BRANCH_NAME,
} from './actrc'
import { addEmptyCommit } from "./scripts/add-empty-commit.ts";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files";
import { createMockGitRepo } from "./scripts/create-mock-git-repo";
import { server } from "./scripts/create-mock-github-server";
import { createMockPullRequest } from "./scripts/create-mock-pull-request.ts";
import { OutputListener } from "./scripts/output-listener";

let tmpDirs: Array<string> = [];
let outputListeners: OutputListener[] = [];
let abourtControllers: AbortController[] = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/guard-against-manual-release.yml"),
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

describe("Guard Against Manual Release", () => {
  it("should close release PR if it was created manually", async () => {
    const { localRepoTmpDir, remoteRepoTmpDir } = createMockGitRepo();
    tmpDirs.push(localRepoTmpDir);
    tmpDirs.push(remoteRepoTmpDir);

    addEmptyCommit({ repo: localRepoTmpDir, branch: RELEASE_BRANCH_NAME });

    const pullRequestEvent = createMockPullRequest({
      repo: localRepoTmpDir,
      branch: RELEASE_BRANCH_NAME,
    });

    const outputListener = new OutputListener({
      streamOutput: true,
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
      .withVars(getVars())
      .withAdditionalArgs(
        ...getAdditionalArgs({
          remoteRepoTmpDir,
          localRepoTmpDir,
        }),
      )
      .forwardOutput()
      .run({ signal: controller.signal });

    /*expect(outputListener.entries.length).toBe(1);
    expect(outputListener.entries[0].message).toBe(
      "Submitted PR contains pending change files. Ready to proceed to the next step.",
    );*/
    expect(status).toBe(ActExecStatus.SUCCESS);
  }, 140_000);
});
