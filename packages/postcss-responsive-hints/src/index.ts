import crypto from "node:crypto";
import { AtRule, Declaration, type PluginCreator, type Rule } from "postcss";

export interface PluginOptions {
  breakpoints?: Array<string>;
  comments?: boolean;
}

const defaultOptions = {
  breakpoints: ["480px", "768px", "1024px", "1200px"],
  comments: false,
} satisfies PluginOptions;

const uniqueId = Symbol("unique rule id");
const isProcessed = Symbol("is processed");

function getUniqueId(node?: Rule | AtRule | Declaration["parent"]) {
  return node && uniqueId in node ? (node[uniqueId] as string) : undefined;
}

function assignAndGetUniqueId(rule: Rule | AtRule) {
  if (uniqueId in rule) {
    return rule[uniqueId] as string;
  }
  const id = crypto.randomUUID();
  // @ts-expect-error
  rule[uniqueId] = id;
  return id;
}

function process(node: Rule | AtRule | Declaration, callback: () => void) {
  // @ts-expect-error
  if (!node[isProcessed]) {
    callback();
    // @ts-expect-error
    node[isProcessed] = true;
  }
}

function applyState({
  node,
  state,
}: {
  node: Rule | AtRule;
  state: Map<string, Map<string, Array<Declaration>>>;
}) {
  const uniqueId = getUniqueId(node);
  if (!uniqueId) {
    return;
  }

  state.get(uniqueId)?.forEach((declarations, query) => {
    if (!declarations.length) {
      return;
    }
    const existingAtRule = node.nodes?.find(
      node => node.type === "atrule" && node.params === query,
    );
    if (existingAtRule && existingAtRule.type === "atrule") {
      existingAtRule.append(...declarations);
    } else {
      const newAtRule = new AtRule({
        name: "media",
        params: query,
        source: node.source,
      });
      newAtRule.append(...declarations);
      node.append(newAtRule);
    }
  });

  state.delete(uniqueId);
}

const plugin: PluginCreator<PluginOptions> = (options = defaultOptions) => {
  const breakpoints = options.breakpoints ?? defaultOptions.breakpoints;
  const comments = options.comments ?? defaultOptions.comments;

  function createState() {
    return new Map<string, Array<Declaration>>(
      breakpoints.slice(1).map(breakpoint => {
        const query = `(min-width: ${breakpoint})`;
        return [query, []];
      }),
    );
  }

  return {
    postcssPlugin: "postcss-responsive-hints",
    prepare() {
      const state: Map<string, Map<string, Array<Declaration>>> | undefined =
        new Map();
      return {
        AtRule: {
          media(atRule) {
            state.set(assignAndGetUniqueId(atRule), createState());
          },
        },
        AtRuleExit: {
          media(atRule) {
            process(atRule, () => {
              applyState({ node: atRule, state });
            });
          },
        },
        Declaration(decl) {
          process(decl, () => {
            if (!decl.parent) {
              return;
            }

            const parentId = getUniqueId(decl.parent);

            if (!parentId) {
              return;
            }

            const value = comments
              ? decl.raws.value?.raw || decl.value
              : decl.value;

            const responsiveValues = value
              .replaceAll(/(\/[*]+\s*|\s*[*]+\/)/g, "")
              .split(/\s*\|\s*/)
              .filter(Boolean);

            if (responsiveValues.length <= 1) {
              return;
            }

            if (responsiveValues.length !== breakpoints.length) {
              throw decl.error(
                "Responsive values number should match breakpoints number",
              );
            }

            const initialValue = responsiveValues.shift();

            // Removing responsive-hints comments,
            // if there were any.
            decl.assign({
              prop: decl.prop,
              raws: { raw: initialValue, value: initialValue },
              value: initialValue,
            });

            breakpoints.slice(1).forEach((breakpoint, i) => {
              const responsiveValue = responsiveValues[i];
              if (responsiveValue === "x") {
                return;
              }
              const query = `(min-width: ${breakpoint})`;
              const newDecl = decl.clone({ value: responsiveValue });
              state?.get(parentId)?.get(query)?.push(newDecl);
            });
          });
        },
        Rule(rule) {
          state.set(assignAndGetUniqueId(rule), createState());
        },
        RuleExit(rule) {
          process(rule, () => {
            applyState({ node: rule, state });
          });
        },
      };
    },
  };
};

plugin.postcss = true;

export default plugin;
