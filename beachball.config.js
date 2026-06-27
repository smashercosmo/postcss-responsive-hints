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
      include: ["packages/*", "*"], // adjusts to match your directory layout
      kind: "synchronized"
    }
  ]
};