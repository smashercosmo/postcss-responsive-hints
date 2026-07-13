import { describe, it, expect, beforeEach } from "vitest";
import { ActRunner, ActExecStatus } from "act-test-runner";
import { EOL } from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { execSync } from "node:child_process";
import url from 'node:url'

const currentDirectory = path.dirname(url.fileURLToPath(import.meta.url));
const rootNodeModulesDirectory = execSync("pnpm root", { encoding: "utf-8" });
const rootProjectDirectory = path.resolve(rootNodeModulesDirectory, "..");

function envFileToJson(envFilePath: string) {
  const envFileBody = fs.readFileSync(envFilePath, "utf8");
  return Object.fromEntries(
    envFileBody
      .split(new RegExp(EOL))
      .filter(Boolean)
      .map((pair) => pair.split("=")),
  ) as Record<string, string>;
}

const varsFilePath = path.resolve(currentDirectory, ".vars.test");
const varsJsonObject = envFileToJson(varsFilePath);
const workflowPath = path.resolve(rootProjectDirectory, ".github/workflows/pr.yml");
const workflowBody = fs.readFileSync(workflowPath, "utf8");

function createActRunner({ branch }: { branch: string; workflow: string }): ActRunner {
  return new ActRunner()
    .withEvent("pull_request", {
      pull_request: { head: { ref: `${branch}` }, base: { ref: "main" } },
    })
    .withVariablesFile(varsFilePath)
    .withWorkflowBody(workflowBody)
    .forwardOutput();
}

describe("Feature PR workflow", () => {
  let actRunner: ActRunner;

  beforeEach(() => {
    actRunner = createActRunner({
      branch: varsJsonObject.FEATURE_BRANCH_NAME,
      workflow: workflowBody,
    });
  });

  it("should fail when feature PR does not have generated changesets", async () => {
    const result = await actRunner.run();

    expect(result.status).toBe(ActExecStatus.FAILED);
  }, 140000);

  it("should succeed when feature PR has generated changesets", async () => {
    const result = await actRunner.withEnvValues(["GENERATE_CHANGESETS", "true"]).run();
    expect(result.status).toBe(ActExecStatus.SUCCESS);
  }, 140000);
});

describe("Release PR workflow", () => {
  let actRunner: ActRunner;

  beforeEach(() => {
    actRunner = createActRunner({
      branch: varsJsonObject.RELEASE_BRANCH_NAME,
      workflow: workflowBody,
    });
  });

  it("should fail when release PR has generated changesets", async () => {
    const result = await actRunner.withEnvValues(["GENERATE_CHANGESETS", "true"]).run();
    expect(result.status).toBe(ActExecStatus.FAILED);
  }, 140000);

  it("should succeed when release PR doesn't have generated changesets", async () => {
    const result = await actRunner.run();
    expect(result.status).toBe(ActExecStatus.SUCCESS);
  }, 140000);
});
