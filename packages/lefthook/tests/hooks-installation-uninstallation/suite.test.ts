import path from "node:path";
import url from "node:url";
import { describe, expect, it, afterEach } from "vitest";

import { LefthookRunner, type Config } from "../LefthookRunner";
import commitMsgAndPreCommitConfig from "./commit-msg-and-pre-commit.config.json" with { type: "json" };
import commitMsgConfig from "./commit-msg.config.json" with { type: "json" };
import preCommitConfig from "./pre-commit.config.json" with { type: "json" };

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

describe("LefthookRunner installation/uninstallation", () => {
  afterEach(() => currentRunner?.cleanup());

  describe("Installation", () => {
    it("should install pre-commit and commit-msg hooks", async () => {
      const runner = createRunner([commitMsgConfig, preCommitConfig]);
      expect(runner.getInstalledHooks().length).toBe(0);
      runner.install();

      expect(runner.getInstalledHooks().length).toBe(2);
      expect(runner.isHookInstalled("pre-commit")).toBe(true);
      expect(runner.isHookInstalled("commit-msg")).toBe(true);
    });
  });

  describe("Uninstallation", () => {
    it("should uninstall pre-commit and commit-msg hooks", async () => {
      const runner = createRunner([commitMsgConfig, preCommitConfig]);
      expect(runner.getInstalledHooks().length).toBe(0);
      runner.install();

      expect(runner.getInstalledHooks().length).toBe(2);
      expect(runner.isHookInstalled("pre-commit")).toBe(true);
      expect(runner.isHookInstalled("commit-msg")).toBe(true);

      runner.uninstall();
      expect(runner.getInstalledHooks().length).toBe(0);
      expect(runner.isHookInstalled("pre-commit")).toBe(false);
      expect(runner.isHookInstalled("commit-msg")).toBe(false);
    });
  });

  describe("Installation with different configurations", () => {
    it("should not uninstall hooks if there are absent in the new config", async () => {
      const runner = createRunner([
        commitMsgAndPreCommitConfig,
        commitMsgConfig,
      ]);
      expect(runner.getInstalledHooks().length).toBe(0);
      runner.install();

      expect(runner.getInstalledHooks().length).toBe(2);
      expect(runner.isHookInstalled("pre-commit")).toBe(true);
      expect(runner.isHookInstalled("commit-msg")).toBe(true);
    });
  });
});
