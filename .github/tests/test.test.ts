import {
  ActExecStatus,
  ActRunner,
  ActWorkflowExecResult,
} from "@pshevche/act-test-runner";
import child_process, { type ExecSyncOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterAll, beforeAll } from "vitest";

import { FEATURE_BRANCH_NAME, getActArgs } from "./actrc.ts";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files.ts";
import { createMockGitRepo } from "./scripts/create-mock-git-repo.ts";
import { server } from "./scripts/create-mock-github-server";
import { getSha } from "./scripts/getSha.ts";

const tmpDirs: Array<string> = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/test.yml"),
);

function createActRunner({ branch }: { branch: string }): ActRunner {
  const repoTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-repo-"));
  const originTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-origin-"));

  tmpDirs.push(repoTmpDir);
  tmpDirs.push(originTmpDir);

  createMockGitRepo({ originTmpDir, repoTmpDir });

  const args = getActArgs({
    originTmpDir,
    repoTmpDir,
  });

  const options: ExecSyncOptions = { cwd: repoTmpDir, encoding: "utf8" };

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

  child_process.execSync(`git merge ${branch} --no-ff`, options);
  child_process.execSync("git push --all", options);

  return new ActRunner()
    .withEvent("pull_request", {
      action: "closed",
      number: 10,
      pull_request: {
        base: {
          ref: "main",
        },
        head: {
          ref: `${branch}`,
        },
        id: 666,
        merged: true,
        number: 10,
        state: "closed",
      },
    })
    .withWorkflowFile(workflowPath)
    .withAdditionalArgs(
      ...args
        .flatMap(item => item)
        .concat("--env", "GITHUB_REF=refs/remotes/pull/10/merge")
        .concat(
          "--env",
          `GITHUB_SHA=${getSha({ branch: "main", git_dir: repoTmpDir })}`,
        ),
    )
    .forwardOutput();
}

let actRunnerInProgress: Promise<ActWorkflowExecResult>;

beforeAll(() => {
  server.listen({ port: 9999 });
});

afterAll(() => {
  actRunnerInProgress?.finally(() => server.close());
  /*tmpDirs.forEach(tmpDir => {
    fs.rmSync(tmpDir, { force: true, recursive: true });
  });*/
});

describe("Test workflow", () => {
  it("test", async () => {
    actRunnerInProgress = createActRunner({
      branch: FEATURE_BRANCH_NAME,
    }).run();

    const result = await actRunnerInProgress;
    expect(result.status).toBe(ActExecStatus.FAILED);
  }, 140_000);
});
