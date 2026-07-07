import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { ActRunner, ActExecStatus } from "@pshevche/act-test-runner";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type Release = {
  name: string;
  type: string;
  oldVersion: string;
  newVersion: string;
};

function getJsonFromResultOutput<T>(output: string) {
  const JSON_REGEX = /```json\s+([\s\S]*?)```/;
  const match = output.match(JSON_REGEX);
  const rawJsonString = match && match[1] ? match[1].trim() : "{}";
  return JSON.parse(rawJsonString) as T;
}

function findReleaseByName({ releases, name }: { releases: Release[]; name: string }) {
  return releases.find((release) => release.name === name);
}

const fixturesDir = join(__dirname, "./__fixtures__");
const workflowPath = join(__dirname, "../workflows/pr.yml");
const workflowBody = readFileSync(workflowPath, "utf8");

describe("PR check workflow", () => {
  it("should successfully run the feature PR workflow", async () => {
    const result = await new ActRunner()
      .withEvent("pull_request")
      .withAdditionalArgs("--eventpath", join(fixturesDir, "./events/feature-pr-event.json"))
      .withWorkflowBody(workflowBody)
      .forwardOutput()
      .run();

    const { releases } = getJsonFromResultOutput<{ releases: Release[] }>(result.output);
    const postcssResponsiveHintsRelease = findReleaseByName({
      releases,
      name: "postcss-responsive-hints",
    });
    const postcssResponsiveHintsExampleRelease = findReleaseByName({
      releases,
      name: "@postcss-responsive-hints/example",
    });

    expect(result.status).toBe(ActExecStatus.SUCCESS);
    expect(releases.length).toBe(2);
    expect(postcssResponsiveHintsRelease?.newVersion).toBe(
      `${Number(postcssResponsiveHintsRelease?.oldVersion[0]) + 1}.0.0`,
    );
    expect(postcssResponsiveHintsExampleRelease?.newVersion).toBe(
      postcssResponsiveHintsExampleRelease?.oldVersion,
    );
  }, 140000);

  it("should successfully run the changeset-release PR workflow", async () => {
    const result = await new ActRunner()
    .withEvent("pull_request")
    .withAdditionalArgs("--eventpath", join(fixturesDir, "./events/changeset-release-pr-event.json"))
    .withWorkflowBody(workflowBody)
    .forwardOutput()
    .run();

    const json = getJsonFromResultOutput<{ "github": { "head_ref": string } }>(result.output);
    
    expect(result.status).toBe(ActExecStatus.SUCCESS);
    expect(json.github.head_ref).toBe("changeset-release/main");
  }, 140000);
});
