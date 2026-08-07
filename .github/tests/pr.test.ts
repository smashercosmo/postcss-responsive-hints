import {
  ActExecStatus,
  ActRunner,
  ActWorkflowExecResult,
} from "@pshevche/act-test-runner";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterAll, beforeAll } from "vitest";

import { FEATURE_BRANCH_NAME, getActArgs } from "./actrc.ts";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files.ts";
import { createMockGitRepo } from "./scripts/create-mock-git-repo.ts";
import { server } from "./scripts/create-mock-github-server";
import { getSha } from './scripts/getSha'

const tmpDirs: Array<string> = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/pr.yml"),
);

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

  if (shouldGenerateChangeFiles) {
    addPendingChangeFiles({
      branch,
      bump: "major",
      git_dir: repoTmpDir,
      pkg: "postcss-responsive-hints",
      summary: "a lot of breaking changes",
    });

    addPendingChangeFiles({
      branch,
      bump: "minor",
      git_dir: repoTmpDir,
      pkg: "shared",
      summary: "better code",
    });
  }

  const headSha = getSha({ branch, git_dir: originTmpDir });
  const baseSha = getSha({ branch: "main", git_dir: originTmpDir });

  return new ActRunner()
    .withEvent("pull_request", {
      number: 1,
      pull_request: {
        base: { ref: "main", sha: baseSha },
        head: { ref: `${branch}`, sha: headSha },
        number: 1,
      },
    })
    .withWorkflowFile(workflowPath)
    .withAdditionalArgs(...args.flatMap(item => item))
    .forwardOutput();
}

let actRunnerInProgress: Promise<ActWorkflowExecResult>;

beforeAll(() => {
  server.listen({ port: 9999 });
});

afterAll(() => {
  actRunnerInProgress?.finally(() => server.close());
  tmpDirs.forEach(tmpDir => {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });
});

describe("PR workflows", () => {
  describe("Feature PR workflow", () => {
    it("should fail when feature PR does not have generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: FEATURE_BRANCH_NAME,
        shouldGenerateChangeFiles: false,
      }).run();

      const result = await actRunnerInProgress;
      expect(result.status).toBe(ActExecStatus.FAILED);
    }, 140_000);

    it("should succeed when feature PR has generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: FEATURE_BRANCH_NAME,
        shouldGenerateChangeFiles: true,
      }).run();

      const result = await actRunnerInProgress;
      expect(result.status).toBe(ActExecStatus.SUCCESS);
    }, 140_000);
  });

  /*  describe("Release PR workflow", () => {
    it("should fail when release PR has generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: RELEASE_BRANCH_NAME,
        shouldGenerateChangeFiles: true,
      }).run();

      const result = await actRunnerInProgress;
      expect(result.status).toBe(ActExecStatus.FAILED);
    }, 140_000);

    it("should succeed when release PR doesn't have generated changesets", async () => {
      actRunnerInProgress = createActRunner({
        branch: RELEASE_BRANCH_NAME,
        shouldGenerateChangeFiles: false,
      }).run();

      const result = await actRunnerInProgress;
      expect(result.status).toBe(ActExecStatus.SUCCESS);
    }, 140_000);
  });*/
});
