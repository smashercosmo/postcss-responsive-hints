import config from "@smashercosmo/configs/oxlint";
import { defineConfig } from "oxlint";

export default defineConfig({
  options: { typeAware: true },
  extends: [config],
  overrides: [
    {
      files: ["apps/*/src/**"],
      env: { browser: true },
      rules: {
        // Vite loads styles through side-effect imports.
        "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
      },
    },
    {
      files: ["*.astro"],
      // Astro's component global, available in frontmatter
      globals: { Astro: "readonly" },
      rules: {
        // Frontmatter and inline scripts don't have to be modules.
        "import/unambiguous": "off",
        // Frontmatter runs at build time, where awaiting data is idiomatic.
        "node/no-top-level-await": "off",
      },
    },
  ],
});
