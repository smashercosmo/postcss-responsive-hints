import path from "node:path";
import url from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { type Config, LefthookRunner } from "../LefthookRunner";
import config from "./config.json" with { type: "json" };

const __directory = path.dirname(url.fileURLToPath(import.meta.url));

let currentRunner: LefthookRunner<Array<Config>> | undefined = undefined;

function createRunner<TConfigs extends Array<Config>>(configs: TConfigs) {
  const runner = new LefthookRunner({
    configs,
    cwd: __directory,
  });
  currentRunner = runner;
  return runner;
}

describe("Hook with external script as condition to skip or run", () => {
  afterEach(() => currentRunner?.cleanup());

  it("should allow using external script for skip/only conditions", async () => {
    const runner = createRunner([config]);
    expect(runner.getInstalledHooks().length).toBe(0);

    runner.install();
    expect(runner.getInstalledHooks().length).toBe(1);

    const jobs = runner.getHook("commit-msg")?.run().getJobsByStatus();

    expect(jobs?.skipped).toStrictEqual(["skipped-job"]);
    expect(jobs?.executed).toStrictEqual(["executed-job"]);
  });
});
