import child_process from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const hooks = [
  "applypatch-msg",
  "commit-msg",
  "commit-msg",
  "fsmonitor-watchman",
  "post-update",
  "pre-applypatch",
  "pre-commit",
  "pre-merge-commit",
  "pre-push",
  "pre-rebase",
  "pre-receive",
  "prepare-commit-msg",
  "push-to-checkout",
  "update",
] as const;

export type Config = { [key in (typeof hooks)[number]]?: object };

class Hook {
  #name: string;
  #git: string;
  #cwd: string;
  #config: string;
  #jobsByStatus: { executed: Array<string>; skipped: Array<string> } = {
    executed: [],
    skipped: [],
  };

  static #JOB_STATUS_REGEX =
    /^[┃│]\s{2}(?<name>.*)\s(\((?<status>.*)\)|(?<executed>❯))/;

  constructor({
    config,
    cwd,
    git,
    name,
  }: {
    config: string;
    cwd: string;
    git: string;
    name: string;
  }) {
    this.#name = name;
    this.#config = config;
    this.#git = git;
    this.#cwd = cwd;
  }

  static #groupJobsByStatus(output: string) {
    const jobs: { executed: Array<string>; skipped: Array<string> } = {
      executed: [],
      skipped: [],
    };

    output.split("\n").forEach(line => {
      const groups = line.match(Hook.#JOB_STATUS_REGEX)?.groups;

      if (groups?.status === "skip") {
        jobs.skipped.push(groups?.name);
        return;
      }

      if (groups?.executed === "❯") {
        jobs.executed.push(groups?.name);
        return;
      }
    });

    return jobs;
  }

  run(env?: Record<string, string>) {
    const output = child_process
      .execSync(`$(pnpm bin)/lefthook run ${this.#name}`, {
        cwd: this.#cwd,
        env: {
          ...process.env,
          ...env,
          GIT_DIR: this.#git,
          LEFTHOOK_CONFIG: this.#config,
        },
      })
      .toString("utf8");

    this.#jobsByStatus = Hook.#groupJobsByStatus(output);
    return this;
  }

  getJobsByStatus() {
    return this.#jobsByStatus;
  }
}

class LefthookConfig<TConfig extends Config> {
  #git: string;
  #cwd: string;
  #tmpDir: string;
  #path: string;
  #hooks: Record<keyof TConfig, Hook>;

  constructor({
    config,
    cwd,
    git,
    rootTmpDir,
  }: {
    config: TConfig;
    cwd: string;
    git: string;
    rootTmpDir: string;
  }) {
    this.#git = git;
    this.#cwd = cwd;
    this.#tmpDir = this.#createTmpDir(rootTmpDir);
    this.#path = this.#createTmpEventPayloadFile(config);
    this.#hooks = Object.fromEntries(
      Object.keys(config).map(hook => [
        hook,
        new Hook({
          config: this.#path,
          cwd,
          git,
          name: hook,
        }),
      ]),
    ) as Record<keyof TConfig, Hook>;
  }

  #createTmpDir(rootTmpDir: string) {
    return fs.mkdtempSync(path.join(rootTmpDir, path.sep));
  }

  #createTmpEventPayloadFile(config: TConfig) {
    if (this.#tmpDir && !fs.existsSync(this.#tmpDir)) {
      throw new Error(
        "Tmp directory hasn't been created. Run `createTmpDir` method first.",
      );
    }

    const fileName = path.join(this.#tmpDir, "lefthook.config.json");
    fs.writeFileSync(fileName, JSON.stringify(config));
    return fileName;
  }

  install() {
    child_process.execSync(`$(pnpm bin)/lefthook install`, {
      cwd: this.#cwd,
      env: {
        ...process.env,
        GIT_DIR: this.#git,
        LEFTHOOK_CONFIG: this.#path,
      },
    });
    return this;
  }

  uninstall() {
    child_process.execSync(`$(pnpm bin)/lefthook uninstall`, {
      cwd: this.#cwd,
      env: {
        ...process.env,
        GIT_DIR: this.#git,
        LEFTHOOK_CONFIG: this.#path,
      },
    });
    return this;
  }

  getHook(name: keyof TConfig) {
    return this.#hooks[name];
  }

  cleanup() {
    if (this.#tmpDir && fs.existsSync(this.#tmpDir)) {
      fs.rmSync(this.#tmpDir, { force: true, recursive: true });
    }
  }
}

export class LefthookRunner<TConfigs extends Array<Config>> {
  #git: string;
  #cwd: string;
  #tmpDir: string;
  #configs: Map<TConfigs[number], LefthookConfig<TConfigs[number]>>;

  constructor({ configs, cwd }: { configs: TConfigs; cwd: string }) {
    this.#cwd = cwd;
    this.#tmpDir = this.#createTmpDir();
    this.#git = this.#createTmpGitDir();
    this.#configs = new Map(
      configs.map(config => [
        config,
        new LefthookConfig({
          config,
          cwd: this.#cwd,
          git: this.#git,
          rootTmpDir: this.#tmpDir,
        }),
      ]),
    );
  }

  #createTmpDir() {
    this.#cleanupTmpDir();
    return fs.mkdtempSync(path.join(os.tmpdir(), path.sep));
  }

  #cleanupTmpDir() {
    if (this.#tmpDir && fs.existsSync(this.#tmpDir)) {
      fs.rmSync(this.#tmpDir, { force: true, recursive: true });
    }
  }

  #createTmpGitDir() {
    if (this.#tmpDir && !fs.existsSync(this.#tmpDir)) {
      throw new Error(
        "Tmp directory hasn't been created. Run `createTmpDir` method first.",
      );
    }

    const gitDirectory = path.join(this.#tmpDir, "git");
    fs.mkdirSync(gitDirectory, { recursive: true });
    child_process.execSync(`git init "${gitDirectory}"`);
    const dotGitDirectory = path.join(gitDirectory, ".git");
    this.#clearHooks(dotGitDirectory);
    return dotGitDirectory;
  }

  #clearHooks(dotGitDirectory: string) {
    const hooksDirectory = path.join(dotGitDirectory, "hooks");
    if (fs.existsSync(hooksDirectory)) {
      fs.readdirSync(hooksDirectory).forEach(file => {
        fs.unlinkSync(path.join(hooksDirectory, file));
      });
    }
  }

  #throwIfConfigIsNotLoaded(config: Config) {
    if (!this.#configs.has(config)) {
      throw new Error(`This config file hasn't been loaded.`);
    }
  }

  isHookInstalled(hook: string) {
    return fs.existsSync(path.join(this.#git, "hooks", hook));
  }

  getInstalledHooks() {
    return fs.readdirSync(path.join(this.#git, "hooks"));
  }

  getConfig(config: Config) {
    return this.#configs.get(config);
  }

  getHook(name: keyof TConfigs[number]) {
    if (this.#configs && this.#configs.size > 1) {
      throw new Error(
        "Multiple configs have been loaded. Use `getConfig` method first to pick one of them.",
      );
    }

    return [...this.#configs.values()].at(0)?.getHook(name);
  }

  install(config?: Config) {
    if (config) {
      this.#throwIfConfigIsNotLoaded(config);
      this.getConfig(config)?.install();
    } else {
      this.#configs.forEach(config => config.install());
    }
  }

  uninstall(config?: Config) {
    if (config) {
      this.#throwIfConfigIsNotLoaded(config);
      this.getConfig(config)?.uninstall();
    } else {
      this.#configs.forEach(config => config.uninstall());
    }
  }

  cleanup() {
    this.#cleanupTmpDir();
    this.#configs = new Map();
    return this;
  }
}
