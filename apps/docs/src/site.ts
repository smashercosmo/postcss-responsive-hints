import pkg from "postcss-responsive-hints/package.json" with { type: "json" };

const VERSION = pkg.version;
const REPO_URL = "https://github.com/smashercosmo/postcss-responsive-hints";
const NPM_URL = "https://www.npmjs.com/package/postcss-responsive-hints";

/** The localStorage key of the picked color theme. */
const THEME_KEY = "postcss-responsive-hints:theme";

/**
 * Prefixes a path with the base of the site, e.g. "changelog/" becomes
 * "/postcss-responsive-hints/changelog/".
 */
function withBase(path = "") {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path}`;
}

/**
 * The name of the view timeline of a docs section, which its link in the table
 * of contents follows, e.g. "usage" becomes "--section-usage".
 */
function sectionTimeline(id: string) {
  return `--section-${id}`;
}

export { NPM_URL, REPO_URL, THEME_KEY, VERSION, sectionTimeline, withBase };
