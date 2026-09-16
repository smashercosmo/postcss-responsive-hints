import {
  ActExecStatus,
  ActRunner,
  type ActWorkflowExecResult,
} from "act-test-runner";
import child_process, { type ExecFileSyncOptions } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterAll, beforeAll } from "vitest";

import { FEATURE_BRANCH_NAME, getAdditionalArgs } from "./actrc.ts";
import { addPendingChangeFiles } from "./scripts/add-pending-change-files.ts";
import { createMockGitRepo } from "./scripts/create-mock-git-repo.ts";
import { server } from "./scripts/create-mock-github-server";

const tmpDirs: Array<string> = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/release.yml"),
);

function createActRunner({ branch }: { branch: string }): ActRunner {
  const repoTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-repo-"));
  const originTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "act-origin-"));

  tmpDirs.push(repoTmpDir);
  tmpDirs.push(originTmpDir);

  createMockGitRepo({ originTmpDir, repoTmpDir });

  const args = getAdditionalArgs({
    originTmpDir,
    repoTmpDir,
  });

  const options: ExecFileSyncOptions = { cwd: repoTmpDir, encoding: "utf8" };

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

  const commitSha = child_process
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
    ["push", "origin", `${commitSha}:refs/pull/10/merge`],
    options,
  );

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
        merge_commit_sha: commitSha,
        merged: true,
        number: 10,
        state: "closed",
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

describe("Release workflow", () => {
  it("should bump versions and update changelogs", async () => {
    actRunnerInProgress = createActRunner({
      branch: FEATURE_BRANCH_NAME,
    }).run();

    const result = await actRunnerInProgress;
    expect(result.status).toBe(ActExecStatus.FAILED);
  }, 140_000);
});
