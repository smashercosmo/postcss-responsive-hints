import type { AstroIntegration } from "astro";

import { defineConfig } from "astro/config";
import {
  createGrammarLoader,
  normalizeLanguage,
} from "microlighter/grammar-dependencies.js";
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { URL } from "node:url";
import responsiveHints from "postcss-responsive-hints";

import { LANGUAGE_ALIASES } from "#root/languages.js";

const LANGUAGE_CLASS = /class="[^"]*\blanguage-(?<language>[\w\-]+)/gv;

/** Grammar names of the languages of the code blocks in the built pages */
async function usedLanguages(dir: URL) {
  const files = await readdir(dir, { recursive: true });
  const reads: Promise<string>[] = [];
  for (const file of files) {
    if (file.endsWith(".html")) {
      reads.push(readFile(new URL(file, dir), "utf8"));
    }
  }
  const pages = await Promise.all(reads);
  const languages = new Set<string>();
  for (const html of pages) {
    for (const match of html.matchAll(LANGUAGE_CLASS)) {
      const language = match.groups?.["language"];
      if (language !== undefined) {
        languages.add(normalizeLanguage(language, LANGUAGE_ALIASES));
      }
    }
  }
  return [...languages];
}

/**
 * Microlighter lazy-loads its grammars with
 * import(`./grammars/${language}.js`), relative to its own module. The bundler
 * doesn't follow that import, so the grammars are copied next to the bundled
 * chunk: the languages of the code blocks of the built pages, plus the grammars
 * those embed.
 */
function microlighterGrammars(): AstroIntegration {
  let assets = "_astro";
  return {
    name: "microlighter-grammars",
    hooks: {
      "astro:config:done": ({ config }) => {
        ({ assets } = config.build);
      },
      "astro:build:done": async ({ dir, logger }) => {
        const { languages } = await createGrammarLoader()(
          await usedLanguages(dir),
        );
        const names = Object.keys(languages);
        const source = new URL(
          "grammars/",
          import.meta.resolve("microlighter"),
        );
        const target = new URL(`${assets}/grammars/`, dir);
        await mkdir(target, { recursive: true });
        await Promise.all(
          names.map(async (name) => {
            await copyFile(
              new URL(`${name}.js`, source),
              new URL(`${name}.js`, target),
            );
          }),
        );
        logger.info(`Copied grammars: ${names.toSorted().join(", ")}`);
      },
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the site from /postcss-responsive-hints/.
  site: "https://smashercosmo.github.io",
  base: "/postcss-responsive-hints",
  // GitHub Pages redirects URLs without a trailing slash, so links have one.
  trailingSlash: "always",
  build: {
    // The whole stylesheet is small, so it's inlined to save a request.
    inlineStylesheets: "always",
  },
  markdown: {
    // Code is highlighted in the browser, by microlighter.
    syntaxHighlight: false,
  },
  integrations: [microlighterGrammars()],
  vite: {
    css: {
      postcss: {
        /**
         * The site's own styles use the plugin, with the hints in comments:
         * base value | from 40rem | from 64rem.
         */
        plugins: [
          responsiveHints({
            breakpoints: ["0", "40rem", "64rem"],
            comments: true,
          }),
        ],
      },
    },
    // Keeps the relative grammar imports of microlighter working in dev.
    optimizeDeps: {
      exclude: ["microlighter"],
    },
  },
});
