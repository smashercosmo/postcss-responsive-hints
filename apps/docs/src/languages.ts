/**
 * Languages of code blocks that microlighter doesn't know by that name, mapped
 * to one of its grammars. Used when highlighting, and when the build copies the
 * grammars the pages need.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  console: "bash",
};

export { LANGUAGE_ALIASES };
