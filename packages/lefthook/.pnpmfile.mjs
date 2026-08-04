/** @typedef {import("@pnpm/types").PnpmSettings} PnpmSettings */

/**
 * @param {PnpmSettings} config
 * @returns PnpmSettings
 */
function updateConfig(config) {
  config.allowBuilds ??= {};
  config.allowBuilds.lefthook = false;
  return config;
}

export const hooks = {
  updateConfig,
};
