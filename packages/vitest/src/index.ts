import { defineConfig } from "vitest/config";

export const shared = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      enabled: true,
    },
  },
})
