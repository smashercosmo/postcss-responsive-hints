import child_process from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

/** @typedef {import("@pnpm/types").BaseManifest} BaseManifest */
/** @typedef {import("@pnpm/types").PnpmSettings} PnpmSettings */
/** @typedef {import("@pnpm/types").ReadPackageHook} ReadPackageHook */
/** @typedef {(config: PnpmSettings) => PnpmSettings} UpdateComfigHook */
/**
 * @typedef {{
 *   hooks: { readPackage?: ReadPackageHook; updateConfig?: UpdateComfigHook };
 * }} PnpmFileModule
 */

const directoriesContainingWorkspacePackages = child_process
  .execSync(
    'find . -path "*/node_modules" -prune -o -name "package.json" -not -path "./package.json" -print | xargs -n1 dirname',
    { encoding: "utf8" },
  )
  .split(os.EOL)
  .filter(Boolean);

/**
 * @template {BaseManifest} T
 * @param {T} pkg
 * @returns {T}
 */
function noopReadPackage(pkg) {
  return pkg;
}

/**
 * @param {PnpmSettings} config
 * @returns {PnpmSettings}
 */
function noopUpdateConfig(config) {
  return config;
}

/**
 * @type {{
 *   readPackage: ReadPackageHook[];
 *   updateConfig: UpdateComfigHook[];
 * }}
 */
const internalPnpmFilesHooks = {
  readPackage: [noopReadPackage],
  updateConfig: [noopUpdateConfig],
};

/**
 * @template {object} T
 * @param {T} obj
 * @returns {keyof T[]}
 */
function getObjectKeys(obj) {
  const keys = Object.keys(obj);
  return /** @type {any} */ (keys);
}

for (const directory of directoriesContainingWorkspacePackages) {
  const pnpmFilePath = path.resolve(directory, ".pnpmfile.mjs");
  if (fs.existsSync(pnpmFilePath)) {
    const internalRequire = createRequire(pnpmFilePath);
    const pnpmFileModule = /** @type {PnpmFileModule} */ (
      internalRequire("./.pnpmfile.mjs")
    );
    getObjectKeys(pnpmFileModule.hooks).forEach(hook => {
      if (
        hook === "readPackage" &&
        typeof pnpmFileModule.hooks[hook] === "function"
      ) {
        internalPnpmFilesHooks.readPackage.push(pnpmFileModule.hooks[hook]);
      }
      if (
        hook === "updateConfig" &&
        typeof pnpmFileModule.hooks[hook] === "function"
      ) {
        internalPnpmFilesHooks.updateConfig.push(pnpmFileModule.hooks[hook]);
      }
    });
  }
}

/**
 * @template T
 * @param {T} value
 * @param {((arg: T) => T | Promise<T>)[]} fns
 * @returns {Promise<T>}
 */
async function chain(value, fns) {
  let acc = value;
  for (const fn of fns) {
    acc = await fn(acc);
  }
  return acc;
}

/**
 * @param {BaseManifest} pkg
 * @returns {Promise<BaseManifest>}
 */
function readPackage(pkg) {
  return chain(pkg, internalPnpmFilesHooks.readPackage);
}

/**
 * @param {PnpmSettings} config
 * @returns {Promise<PnpmSettings>}
 */
function updateConfig(config) {
  return chain(config, internalPnpmFilesHooks.updateConfig);
}

export const hooks = {
  readPackage,
  updateConfig,
};
