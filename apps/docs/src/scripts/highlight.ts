import { highlightAll } from "microlighter";

import { LANGUAGE_ALIASES } from "#root/languages.js";

/**
 * Forced colors mode turns highlighted tokens into blocks of the system
 * highlight color, which makes code unreadable. Plain text in the system colors
 * is easier to read there.
 */
const forcedColors = matchMedia("(forced-colors: active)");

/**
 * Highlights every code block on the page. Microlighter clears all highlights
 * on each run, so the whole page is highlighted again, not just the block that
 * changed.
 */
function highlight() {
  /**
   * Custom highlights are only Baseline since 2026 (Firefox 149), and
   * microlighter doesn't check for them. Without them, code stays plain text.
   */
  if (!("highlights" in CSS)) {
    return;
  }
  if (forcedColors.matches) {
    CSS.highlights.clear();
  } else {
    void highlightAll({ languageAliases: LANGUAGE_ALIASES });
  }
}

/**
 * Highlights the page, and again whenever code changes. Code that changes
 * dispatches microlighter's `syntax-highlight` event, as its docs recommend:
 *
 * ```ts
 * code.dispatchEvent(new Event("syntax-highlight", { bubbles: true }));
 * ```
 *
 * It's handled here instead of by microlighter's auto runner, which can't take
 * the language aliases and ignores forced colors mode.
 */
function initHighlight() {
  document.addEventListener("syntax-highlight", highlight);
  forcedColors.addEventListener("change", highlight);
  highlight();
}

export { initHighlight };
