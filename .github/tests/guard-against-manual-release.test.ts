import { ActExecStatus, ActRunner } from "act-test-runner";
import fs from "node:fs";
import url from "node:url";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

import {
  getAdditionalArgs,
  getCacheServerArgs,
  getEnvs,
  getSecrets,
  getVars,
  RELEASE_BRANCH_NAME,
} from "./actrc";
import { addEmptyCommit } from "./scripts/add-empty-commit.ts";
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
      number: 20,
    });

    const outputListener = new OutputListener({
      streamOutput: false,
      filter(entry) {
        return (
          entry.step?.name === "close-pr-with-comment" &&
          (entry.message.includes("::notice::") ||
            entry.message.includes("::debug::") ||
            entry.message.includes("::error::")
          )
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
      .withVars(getVars())
      .withAdditionalArgs(
        ...getAdditionalArgs({
          remoteRepoTmpDir,
          localRepoTmpDir,
        }),
      )
      .forwardOutput(outputListener)
      .run({ signal: controller.signal });

    const entries = outputListener.getEntries();
    expect(entries.length).toBe(3);
    expect(entries[1].message).toBe(
      "::debug::Comment added to the PR #20: **Notice:** Release PRs cannot be created manually. Please let the automated release workflow handle this. Closing this PR.",
    );
    expect(entries[2].message).toBe(
      "::debug::PR #20 has been closed.",
    );
    expect(entries[3].message).toBe(
      "::error::It is forbidden to create release PRs manually. Release process should be handled by the release bot.",
    );
    expect(status).toBe(ActExecStatus.FAILED);
  }, 140_000);
});
