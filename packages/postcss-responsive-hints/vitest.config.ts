import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dir: "./tests",
    include: ["**/*.test111.ts"],
    name: "postcss-responsive-hints",
  },
});
