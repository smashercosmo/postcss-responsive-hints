import type { Declaration, Node, Plugin, PluginCreator, Rule } from "postcss";

import { AtRule } from "postcss";

interface PluginOptions {
  /**
   * One per responsive value, smallest first. The first value is the base
   * value, without a media query, so the first breakpoint itself is never used
   * in a query.
   *
   * @default ["480px", "768px", "1024px", "1200px"]
   */
  breakpoints?: string[];
  /**
   * Read the hints from a comment after the base value, which keeps the source
   * valid CSS:
   *
   * ```css
   * padding: 10px; /* | 20px | x | 30px *\/;
   * ```
   *
   * @default false
   */
  comments?: boolean;
}

/** Responsive declarations of a rule, grouped by their media query. */
type RuleState = Map<string, Declaration[]>;

const defaultOptions = {
  breakpoints: ["480px", "768px", "1024px", "1200px"],
  comments: false,
} satisfies PluginOptions;

/**
 * At-rules that can contain declarations and a nested `@media`, like a style
 * rule.
 */
const supportedAtRules = new Set([
  "container",
  "layer",
  "media",
  "scope",
  "supports",
]);

const unsupportedParentMessage =
  "Responsive hints can only be used in style rules and in @media, @supports, @container, @layer and @scope";

const uniqueId = Symbol("unique rule id");
const isProcessed = Symbol("is processed");

interface TrackedNode {
  [uniqueId]?: string;
  [isProcessed]?: true;
}

function track(node: Node): Node & TrackedNode {
  return node;
}

function getUniqueId(node: Node | undefined) {
  return node === undefined ? undefined : track(node)[uniqueId];
}

function assignAndGetUniqueId(rule: Rule | AtRule) {
  const tracked = track(rule);
  // The global `crypto`, not `node:crypto`, so the plugin also runs in browsers.
  tracked[uniqueId] ??= globalThis.crypto.randomUUID();
  return tracked[uniqueId];
}

/**
 * PostCSS visits a node again after it changes. Returns `true` only the first
 * time, so every node is processed once.
 */
function isFirstVisit(node: Node) {
  const tracked = track(node);
  if (tracked[isProcessed]) {
    return false;
  }
  tracked[isProcessed] = true;
  return true;
}

function isSupportedAtRule(atRule: AtRule) {
  return supportedAtRules.has(atRule.name.toLowerCase());
}

/** Keyframe blocks are rules too, but can't contain media queries. */
function isKeyframe(rule: Rule) {
  return (
    rule.parent?.type === "atrule" &&
    rule.parent.name.toLowerCase().endsWith("keyframes")
  );
}

interface Token {
  type: "comment" | "string" | "text";
  value: string;
}

/** The index after the string that starts at `start`. */
function findStringEnd(value: string, start: number) {
  const quote = value.charAt(start);
  let index = start + 1;
  while (index < value.length) {
    const char = value.charAt(index);
    if (char === quote) {
      return index + 1;
    }
    index += char === "\\" ? 2 : 1;
  }
  return value.length;
}

/** The index after the comment that starts at `start`. */
function findCommentEnd(value: string, start: number) {
  const end = value.indexOf("*/", start + 2);
  return end === -1 ? value.length : end + 2;
}

/** Splits a value into strings, comments, and the text between them. */
function tokenize(value: string) {
  const tokens: Token[] = [];
  let text = "";
  let index = 0;

  while (index < value.length) {
    const char = value.charAt(index);
    const isString = char === '"' || char === "'";
    const isComment = !isString && value.startsWith("/*", index);

    if (isString || isComment) {
      if (text !== "") {
        tokens.push({ type: "text", value: text });
        text = "";
      }
      const end = isString
        ? findStringEnd(value, index)
        : findCommentEnd(value, index);
      tokens.push({
        type: isString ? "string" : "comment",
        value: value.slice(index, end),
      });
      index = end;
    } else {
      text += char;
      index += 1;
    }
  }

  if (text !== "") {
    tokens.push({ type: "text", value: text });
  }
  return tokens;
}

/** The text of a comment, without its delimiters, e.g. of `/** | 20px *\/`. */
function getCommentText(comment: string) {
  let start = 2;
  let end = comment.endsWith("*/") ? comment.length - 2 : comment.length;
  while (start < end && comment.charAt(start) === "*") {
    start += 1;
  }
  while (end > start && comment.charAt(end - 1) === "*") {
    end -= 1;
  }
  return comment.slice(start, end);
}

/**
 * Replaces every comment that starts with `|`, e.g. `10px /* | 20px *\/`, with
 * its text, so the hints in it are read. Other comments are removed.
 */
function readHintComments(value: string) {
  return tokenize(value)
    .map((token) => {
      if (token.type !== "comment") {
        return token.value;
      }
      const text = getCommentText(token.value);
      return text.trimStart().startsWith("|") ? ` ${text} ` : " ";
    })
    .join("");
}

/**
 * Splits a value at every `|` that isn't inside a string or parentheses, e.g.
 * `"a | b"` or `url(a|b.png)`.
 */
function splitResponsiveValues(value: string) {
  const values: string[] = [];
  let current = "";
  let depth = 0;

  for (const token of tokenize(value)) {
    if (token.type === "text") {
      for (const char of token.value) {
        if (char === "(") {
          depth += 1;
        } else if (char === ")") {
          depth = Math.max(0, depth - 1);
        }

        if (char === "|" && depth === 0) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    } else {
      current += token.value;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Checks the values of a declaration with responsive hints. A trailing `|` is
 * allowed, e.g. `red /* | green | blue | pink | *\/`.
 */
function validateResponsiveValues(
  decl: Declaration,
  values: string[],
  breakpointCount: number,
) {
  const checked = values.at(-1) === "" ? values.slice(0, -1) : values;

  if (checked.includes("")) {
    throw decl.error(
      "Responsive values can't be empty. Use `x` to skip a breakpoint",
    );
  }

  if (checked.length !== breakpointCount) {
    throw decl.error(
      `Expected ${breakpointCount} responsive values, one per breakpoint, but got ${checked.length}`,
    );
  }

  if (checked[0] === "x") {
    throw decl.error(
      "The first responsive value is the base value, so it can't be `x`",
    );
  }

  return checked;
}

function applyState({
  node,
  state,
}: {
  node: Rule | AtRule;
  state: Map<string, RuleState>;
}) {
  const id = getUniqueId(node);
  if (id === undefined) {
    return;
  }

  for (const [query, declarations] of state.get(id) ?? []) {
    if (declarations.length > 0) {
      const existingAtRule = node.nodes?.find(
        (child) =>
          child.type === "atrule" &&
          child.name.toLowerCase() === "media" &&
          child.params === query,
      );
      if (existingAtRule?.type === "atrule") {
        existingAtRule.append(...declarations);
      } else {
        const newAtRule = new AtRule({ name: "media", params: query });
        if (node.source) {
          newAtRule.source = node.source;
        }
        newAtRule.append(...declarations);
        node.append(newAtRule);
      }
    }
  }

  state.delete(id);
}

function plugin(options: PluginOptions = defaultOptions): Plugin {
  const breakpoints = options.breakpoints ?? defaultOptions.breakpoints;
  const comments = options.comments ?? defaultOptions.comments;
  const queries = breakpoints
    .slice(1)
    .map((breakpoint) => `(min-width: ${breakpoint})`);

  function createState(): RuleState {
    return new Map(queries.map((query) => [query, []]));
  }

  return {
    postcssPlugin: "postcss-responsive-hints",
    prepare() {
      const state = new Map<string, RuleState>();
      return {
        AtRule(atRule) {
          if (isSupportedAtRule(atRule)) {
            state.set(assignAndGetUniqueId(atRule), createState());
          }
        },
        AtRuleExit(atRule) {
          if (isSupportedAtRule(atRule) && isFirstVisit(atRule)) {
            applyState({ node: atRule, state });
          }
        },
        Declaration(decl) {
          if (!isFirstVisit(decl)) {
            return;
          }

          const rawValue = decl.raws.value?.raw;
          const value =
            comments && rawValue !== undefined && rawValue !== ""
              ? readHintComments(rawValue)
              : decl.value;

          const values = splitResponsiveValues(value);

          if (values.length <= 1) {
            return;
          }

          const parentId = getUniqueId(decl.parent);

          if (parentId === undefined) {
            throw decl.error(unsupportedParentMessage);
          }

          const [initialValue, ...restValues] = validateResponsiveValues(
            decl,
            values,
            breakpoints.length,
          );

          // Removes the responsive-hints comments, if there were any.
          decl.assign({
            prop: decl.prop,
            raws: { raw: initialValue, value: initialValue },
            value: initialValue,
          });

          for (const [index, query] of queries.entries()) {
            const responsiveValue = restValues[index];
            if (responsiveValue !== undefined && responsiveValue !== "x") {
              const newDecl = decl.clone({ value: responsiveValue });
              state.get(parentId)?.get(query)?.push(newDecl);
            }
          }
        },
        Rule(rule) {
          if (!isKeyframe(rule)) {
            state.set(assignAndGetUniqueId(rule), createState());
          }
        },
        RuleExit(rule) {
          if (isFirstVisit(rule)) {
            applyState({ node: rule, state });
          }
        },
      };
    },
  };
}

plugin.postcss = true as const;

/**
 * Turns `padding: 10px | 20px | x | 30px` into a base value plus one
 * `min-width` media query per breakpoint. `x` skips a breakpoint.
 */
const postcssResponsiveHints: PluginCreator<PluginOptions> = plugin;

export type { PluginOptions };

// oxlint-disable-next-line import/no-default-export -- PostCSS plugins are default exports by convention
export default postcssResponsiveHints;
