import { defineConfig } from "oxlint";

export default defineConfig({
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.js"],
      rules: {
        "accessor-pairs": "error",
        "typescript/adjacent-overload-signatures": "error",
        "alt-text": "error",
        "promise/always-return": "error",

      },
    },
  ],
});
