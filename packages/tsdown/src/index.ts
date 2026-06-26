import { defineConfig } from "tsdown";

export const base = defineConfig({
  entry: ["src/index.ts"],
  clean: false,
  dts: true,
  exports: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false,
  },
});