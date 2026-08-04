import { findPackageRootDirectory } from "@root/shared";
import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterEach } from "vitest";

import { type Config, LefthookRunner } from "../LefthookRunner";
import config from "./config.json";

const __directory = path.dirname(url.fileURLToPath(import.meta.url));
const __root = findPackageRootDirectory(__directory);

let currentRunner: LefthookRunner<Array<Config>> | undefined = undefined;

function createRunner<TConfigs extends Array<Config>>(configs: TConfigs) {
  const runner = new LefthookRunner({
    configs,
    cwd: __directory,
  });
  currentRunner = runner;
  return runner;
}

describe("LefthookRunner with commitlint integration", () => {
  afterEach(() => currentRunner?.cleanup());

  it("lint commit", async () => {
    const runner = createRunner([config]);
    expect(runner.getInstalledHooks().length).toBe(0);

    runner.install();
    expect(runner.getInstalledHooks().length).toBe(1);

    const env = {
      COMMIT_EDITMSG: url.fileURLToPath(
        import.meta.resolve("./COMMIT_EDITMSG"),
      ),
      ROOT_DIR: __root,
    };
    const jobs = runner.getHook("commit-msg")?.run(env).getJobsByStatus();

    expect(jobs?.skipped).toStrictEqual(["lint-changesets-commits"]);
    expect(jobs?.executed).toStrictEqual(["lint-commits"]);
  });

  it("lint changesets commit", async () => {
    const runner = createRunner([config]);
    expect(runner.getInstalledHooks().length).toBe(0);

    runner.install();
    expect(runner.getInstalledHooks().length).toBe(1);

    const env = {
      COMMIT_EDITMSG: url.fileURLToPath(
        import.meta.resolve("./COMMIT_EDITMSG_CHANGESETS"),
      ),
      ROOT_DIR: __root,
    };
    const jobs = runner.getHook("commit-msg")?.run(env).getJobsByStatus();

    expect(jobs?.skipped).toStrictEqual(["lint-commits"]);
    expect(jobs?.executed).toStrictEqual(["lint-changesets-commits"]);
  });
});
