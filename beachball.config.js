// @ts-check
/** @type {import('beachball').BeachballConfig} */
module.exports = {
  branch: "main",
  privatePackages: {
    version: true,
  },
  groups: [
    {
      name: "all-packages",
      include: ["packages/*", "apps/*"],
      kind: "synchronized",
      mainPackageName: "postcss-responsive-hints",
      changelogPath: "./"
    }
  ]
};