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

import { getActArgs, RELEASE_BRANCH_NAME } from './actrc.ts'
import { createMockGitRepo } from "./scripts/create-mock-git-repo.ts";
import { server } from "./scripts/create-mock-github-server";
import { getSha } from './scripts/getSha'

const tmpDirs: Array<string> = [];

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/guard-release.yml"),
);

function createActRunner({
  branch,
}: {
  branch: string;
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

  const headSha = getSha({ branch, git_dir: originTmpDir });
  const baseSha = getSha({ branch: "main", git_dir: originTmpDir });

  return new ActRunner()
    .withEvent("pull_request", {
      action: "opened",
      number: 1,
      pull_request: {
        base: { ref: "main", sha: baseSha },
        head: { ref: `${branch}`, sha: headSha },
        number: 1,
        state: "open",
      },
      sender: {
        type: "User"
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

describe("Guard release workflow", () => {
  it("should fail when release PR was created manually", async () => {
    actRunnerInProgress = createActRunner({
      branch: RELEASE_BRANCH_NAME
    }).run();

    const result = await actRunnerInProgress;
    expect(result.status).toBe(ActExecStatus.FAILED);
  }, 140_000);
});

