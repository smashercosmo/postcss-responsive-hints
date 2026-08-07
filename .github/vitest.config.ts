import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: "./vitest.setup.global.ts",
    include: ["./tests/**/*.test.ts"],
    name: "actions",
  },
});
