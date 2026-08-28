import {
  ActExecStatus,
  ActRunner,
  type ActWorkflowExecResult,
} from "@pshevche/act-test-runner";
import child_process, { type ExecFileSyncOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterAll, beforeAll } from "vitest";

import { FEATURE_BRANCH_NAME, getActArgs, RELEASE_BRANCH_NAME } from "./actrc";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files";
import { createMockGitRepo } from "./scripts/create-mock-git-repo";
import { server } from "./scripts/create-mock-github-server";
import { OutputListener } from "./scripts/output-listener";

const tmpDirs: Array<string> = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/check-changes.yml"),
);

const CACHE_SERVER_PORT = 61_321;

function createActRunner({
  branch,
  shouldGenerateChangeFiles,
}: {
  branch: string;
  shouldGenerateChangeFiles: boolean;
}): ActRunner {
  const repoTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-repo-"));
  const originTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-origin-"));

  tmpDirs.push(repoTmpDir);
  tmpDirs.push(originTmpDir);

  createMockGitRepo({ originTmpDir, repoTmpDir });

  const args = getActArgs({
    originTmpDir,
    repoTmpDir,
  });

  const options: ExecFileSyncOptions = { cwd: originTmpDir, encoding: "utf8" };
  let commitSha: string;

  if (shouldGenerateChangeFiles) {
    addPendingChangeFiles({
      branch,
      bump: "major",
      options,
      pkg: "postcss-responsive-hints",
      summary: "a lot of breaking changes",
    });

    addPendingChangeFiles({
      branch,
      bump: "minor",
      options,
      pkg: "@root/shared",
      summary: "better code",
    });

    const treeSha = child_process
      .execFileSync(
        "git",
        ["merge-tree", "--write-tree", "main", branch],
        options,
      )
      .toString()
      .trim();

    commitSha = child_process
      .execFileSync(
        "git",
        [
          "commit-tree",
          treeSha,
          "-p",
          "main",
          "-p",
          branch,
          "-m",
          `Merge branch ${branch} into main`,
        ],
        options,
      )
      .toString()
      .trim();

    child_process.execFileSync(
      "git",
      ["update-ref", "refs/pull/10/merge", commitSha],
      options,
    );
  }

  return new ActRunner()
    .withEvent("pull_request", {
      action: "opened",
      number: 10,
      pull_request: {
        base: { ref: "main" },
        head: { ref: branch },
        number: 10,
        state: "open",
      },
    })
    .withCacheServer({
      path: "/tmp/act-cache",
      host: "0.0.0.0",
      port: CACHE_SERVER_PORT,
    })
    .withSecrets({
      values: {
        RELEASE_BOT_PRIVATE_KEY: "DUMMY_PRIVATE_KEY",
        GITHUB_TOKEN: "DUMMY_TOKEN",
      },
    })
    .withVariables({
      values: {
        RELEASE_BOT_APP_ID: "some-app-id",
        RELEASE_BRANCH_NAME: `${RELEASE_BRANCH_NAME}`,
        FEATURE_BRANCH_NAME: `${FEATURE_BRANCH_NAME}`,
      },
    })
    .withEnv({
      values: {
        GITHUB_API_URL: "http://host.docker.internal:9999",
        GIT_CONFIG_COUNT: "2",
        GIT_CONFIG_KEY_0: `url.${originTmpDir}.insteadOf`,
        GIT_CONFIG_VALUE_0:
          "https://github.com/smashercosmo/postcss-responsive-hints.git",
        GIT_CONFIG_KEY_1: `remote.origin.fetch`,
        GIT_CONFIG_VALUE_1: "+refs/*:refs/*",
        GITHUB_SERVER_URL: "https://github.com",
        GITHUB_REPOSITORY: "smashercosmo/postcss-responsive-hints",
      },
    })
    .withWorkflow({ file: workflowPath })
    .withAdditionalArgs(...args.flatMap(item => item));
}

let actRunnerInProgress: Promise<ActWorkflowExecResult>;
let outputListener = new OutputListener({ streamOutput: true });

beforeAll(() => {
  server.listen({ port: 9999 });
});

afterAll(() => {
  actRunnerInProgress?.finally(() => {
    server.close();
  });
  /*tmpDirs.forEach(tmpDir => {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });*/
  outputListener.clear();
});

describe("Check Changes", () => {
  describe("Feature PR workflow", () => {
    it.skip("should fail when feature PR does not have generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: FEATURE_BRANCH_NAME,
        shouldGenerateChangeFiles: false,
      })
        .forwardOutput(outputListener)
        .run();

      const { status } = await actRunnerInProgress;

      console.log(outputListener.entries[0].message);

      expect(outputListener.entries.length).toBe(1);
      expect(outputListener.entries[0].message).toBe(
        "No pending change files found in the submitted PR. Please run `pnpm change` and push the generated change files.",
      );
      expect(outputListener.entries[0].step).toBe("failure");
      expect(outputListener.entries[0].job).toBe(
        "check-for-pending-change-files",
      );
      expect(status).toBe(ActExecStatus.FAILED);
    }, 140_000);

    it("should succeed when feature PR has generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: FEATURE_BRANCH_NAME,
        shouldGenerateChangeFiles: true,
      })
        .forwardOutput(outputListener)
        .run();

      const { status } = await actRunnerInProgress;

      expect(outputListener.entries.length).toBe(1);
      expect(outputListener.entries[0].message).toBe(
        "Submitted PR contains pending change files. Ready to proceed to the next step.",
      );
      expect(outputListener.entries[0].step).toBe("success");
      expect(outputListener.entries[0].job).toBe(
        "check-for-pending-change-files",
      );
      expect(status).toBe(ActExecStatus.SUCCESS);
    }, 140_000);
  });
});
