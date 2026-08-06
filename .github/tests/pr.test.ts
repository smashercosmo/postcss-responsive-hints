import { ActRunner, ActExecStatus } from "@pshevche/act-test-runner";
import url from "node:url";
import { describe, it, expect, beforeEach, inject } from "vitest";

import {
  getActArgs,
  FEATURE_BRANCH_NAME,
  RELEASE_BRANCH_NAME,
} from "./actrc.ts";

const args = getActArgs({ gitTmpDir: inject("GIT_TMP_DIR") });

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/pr.yml"),
);

function createActRunner({ branch }: { branch: string }): ActRunner {
  return new ActRunner()
    .withEvent("pull_request", {
      pull_request: { base: { ref: "main" }, head: { ref: `${branch}` } },
    })
    .withWorkflowFile(workflowPath)
    .withAdditionalArgs(...args.flatMap(item => item))
    .forwardOutput();
}

describe("PR workflows", () => {
  describe("Feature PR workflow", () => {
    let actRunner: ActRunner;

    beforeEach(() => {
      actRunner = createActRunner({
        branch: FEATURE_BRANCH_NAME,
      });
    });

    it("should fail when feature PR does not have generated changesets", async () => {
      const result = await actRunner.run();

      expect(result.status).toBe(ActExecStatus.FAILED);
    }, 140_000);

    it("should succeed when feature PR has generated changesets", async () => {
      const result = await actRunner
          .withEnvValues(["ADD_PENDING_CHANGE_FILES", "true"])
          .run();

      expect(result.status).toBe(ActExecStatus.SUCCESS);
    }, 140_000);
  });

  describe("Release PR workflow", () => {
    let actRunner: ActRunner;

    beforeEach(() => {
      actRunner = createActRunner({
        branch: RELEASE_BRANCH_NAME,
      });
    });

    it("should fail when release PR has generated changesets", async () => {
      const result = await actRunner
          .withEnvValues(["ADD_PENDING_CHANGE_FILES", "true"])
          .run();

      expect(result.status).toBe(ActExecStatus.FAILED);
    }, 140_000);

    it("should succeed when release PR doesn't have generated changesets", async () => {
      const result = await actRunner.run();

      expect(result.status).toBe(ActExecStatus.SUCCESS);
    }, 140_000);
  });
})

