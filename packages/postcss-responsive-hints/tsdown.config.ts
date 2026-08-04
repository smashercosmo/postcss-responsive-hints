import { defineConfig } from "tsdown";

export default defineConfig({
  deps: {
    neverBundle: true,
  },
  dts: true,
  entry: ["src/index.ts"],
  exports: {
    devExports: true,
    packageJson: true,
  },
  fixedExtension: false,
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  target: "esnext",
  treeshake: {
    moduleSideEffects: false,
  },
  unbundle: true,
});
