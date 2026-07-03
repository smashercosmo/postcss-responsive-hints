import { defineConfig } from "vitest/config";

// Temp bypass to see if mergeConfig is breaking it
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "actions",
          include: ["./.github/tests/**/*.test.ts"],
        }
      },
    ],
  }
});