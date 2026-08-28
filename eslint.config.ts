import pluginGitHubAction from "eslint-plugin-github-action";
import { defineConfig } from "eslint/config";
import { parseForESLint } from "yaml-eslint-parser";

export default defineConfig([
  {
    files: ["**/.github/workflows/*.y?(a)ml"],
    ignores: ["!**/.github/workflows/*.y?(a)ml"],
    languageOptions: {
      parser: { parseForESLint },
    },
    plugins: {
      "github-action": pluginGitHubAction,
    },
    rules: {
      "github-action/action-name-casing": "error",
      "github-action/job-id-casing": "error",
      "github-action/no-invalid-key": "error",
      "github-action/no-top-level-env": "error",
      "github-action/no-unpinned-uses": "error",
      "github-action/prefer-cancel-in-progress": "error",
      "github-action/prefer-file-extension": "error",
      "github-action/prefer-step-uses-style": [
        "error",
        { allowRepository: true, commit: true },
      ],
      "github-action/require-action-name": "error",
      "github-action/require-concurrency-group": "error",
      "github-action/require-job-name": "error",
      "github-action/valid-timeout-minutes": "error",
      "github-action/valid-trigger-events": "error",
    },
  },
]);
