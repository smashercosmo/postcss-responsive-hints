import { ActRunner, ActExecStatus } from "@pshevche/act-test-runner";
import url from "node:url";
import { describe, it, expect, beforeEach, inject } from "vitest";

import { getActArgs } from "./actrc.ts";

const args = getActArgs({ gitTmpDir: inject("GIT_TMP_DIR") });

const workflowPath = url.fileURLToPath(
  import.meta.resolve("../workflows/release.yml"),
);

function createActRunner(): ActRunner {
  return new ActRunner()
    .withEvent("push")
    .withWorkflowFile(workflowPath)
    .withAdditionalArgs(...args.flatMap(item => item))
    .forwardOutput();
}

describe("Release workflows", () => {
  describe("Release workflow", () => {
    let actRunner: ActRunner;

    beforeEach(() => {
      actRunner = createActRunner();
    });

    it("hello world", async () => {
      const result = await actRunner
        .withEnvValues(["ADD_PENDING_CHANGE_FILES", "true"])
        .run();

      expect(result.status).toBe(ActExecStatus.FAILED);
    }, 140_000);
  });
});
