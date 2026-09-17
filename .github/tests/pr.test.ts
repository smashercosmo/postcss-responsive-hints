import { ActExecStatus, ActRunner } from "act-test-runner";
import fs from "node:fs";
import url from "node:url";
import { describe, expect, it, afterAll, beforeAll } from "vitest";

import {
  FEATURE_BRANCH_NAME,
  getAdditionalArgs,
  getCacheServerArgs,
  getEnvs,
  getSecrets,
  getVars,
} from "./actrc.ts";
import { addEmptyCommit } from "./scripts/add-empty-commit.ts";
import { createMockGitRepo } from "./scripts/create-mock-git-repo.ts";
import { server } from "./scripts/create-mock-github-server";
import { createMockPullRequest } from "./scripts/create-mock-pull-request.ts";
import { OutputListener } from "./scripts/output-listener.ts";

let tmpDirs: Array<string> = [];
let outputListeners: OutputListener[] = [];
let abourtControllers: AbortController[] = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/pr.yml"),
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

describe("PR workflows", () => {
  it("should run lint checks and tests", async () => {
    const { localRepoTmpDir, remoteRepoTmpDir } = createMockGitRepo();
    tmpDirs.push(localRepoTmpDir);
    tmpDirs.push(remoteRepoTmpDir);

    addEmptyCommit({ repo: localRepoTmpDir, branch: FEATURE_BRANCH_NAME });

    const pullRequestEvent = createMockPullRequest({
      repo: localRepoTmpDir,
      branch: FEATURE_BRANCH_NAME,
      number: 30,
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
      .forwardOutput(outputListener)
      .run({ signal: controller.signal });

    expect(status).toBe(ActExecStatus.SUCCESS);
  }, 140_000);
});
