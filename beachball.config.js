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
      include: ["packages/*", "apps/*"], // adjusts to match your directory layout
      kind: "synchronized",
      mainPackageName: "postcss-responsive-hints",
      changelogPath: "./"
    }
  ]
};