import  { type Declaration, type AtRule, type Plugin } from 'postcss';

export interface PluginOptions {
  comments?: boolean;
  breakpoints?: string[];
}

const VALUE_REGEXP = /\/\*\s*\|\s*(.*?)\s*\|\s*\*\//;
const SPLIT_REGEXP = /\s*\|\s*/;

const defaultOptions = {
  comments: false,
  breakpoints: ['480px', '768px', '1024px', '1200px'],
} satisfies PluginOptions;

function postcssResponsiveValuesPlugin(userOptions: PluginOptions = {}): Plugin {
  const breakpoints = userOptions.breakpoints || defaultOptions.breakpoints;
  const comments = userOptions.comments || defaultOptions.comments;

  return {
    postcssPlugin: 'postcss-responsive-hints',
    Once(root, { AtRule, Rule, Declaration }) {
      root.walkRules((rule) => {

        // Initialize an array of tuples to keep track of breakpoints and their new declarations
        const breakpointTuples: [number, []][] = breakpoints.map(
          (_, i) => [i, []]
        );
        const allDecls = new Map<number, Declaration[]>(breakpointTuples);

        rule.walkDecls((decl) => {
          // PostCSS raws aren't strongly typed for custom values, so we cast to any
          const value = comments
            ? decl.raws.value?.raw || decl.value
            : decl.value;

          if (!value) return;

          let responsiveValuesString = value;

          if (comments) {
            const responsiveValuesMatch = value.match(VALUE_REGEXP) || [];
            responsiveValuesString = responsiveValuesMatch[1] || '';
          }

          if (!responsiveValuesString) return;

          // e.g., ['10px', 'x', '10px']
          const responsiveValues = responsiveValuesString
          .split(SPLIT_REGEXP)
          .filter(Boolean);

          const initialValue = comments ? decl.value : responsiveValues.shift();

          if (!responsiveValues.length) return;

          if (responsiveValues.length > breakpoints.length) {
            // 3. PostCSS 8 encourages using node.error() for better stack traces
            throw decl.error('Responsive values number is greater than breakpoints number');
          }

          responsiveValues.forEach((responsiveValue, i) => {
            if (responsiveValue === 'x') return;

            const newDecl = new Declaration({
              prop: decl.prop,
              value: responsiveValue,
            });

            allDecls.get(i)!.push(newDecl);
          });

          if (initialValue !== undefined) {
            decl.value = initialValue;
          }
        });

        let prevMediaQuery: AtRule | null = null;

        allDecls.forEach((newDecls, key) => {
          if (!newDecls.length) return;

          const mediaQuery = new AtRule({
            name: 'media',
            params: `(min-width: ${breakpoints[key]})`,
          });

          const newRule = new Rule({
            selector: rule.selector,
          });

          newDecls.forEach((newDecl) => {
            newRule.append(newDecl);
          });

          mediaQuery.append(newRule);

          if (prevMediaQuery) {
            prevMediaQuery.after(mediaQuery);
          } else {
            rule.after(mediaQuery);
          }

          prevMediaQuery = mediaQuery;
        });
      });
    },
  };
}

postcssResponsiveValuesPlugin.postcss = true;
export default postcssResponsiveValuesPlugin;