import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./vitest.setup.global.ts",
    include: ["./tests/**/*.test.ts"],
    name: "actions",
    setupFiles: "./vitest.setup.ts"
  },
});
