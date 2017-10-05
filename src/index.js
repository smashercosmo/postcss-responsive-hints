const postcss = require('postcss')
const pkg = require('../package.json')

// This regular expression matches the following part:
//           |---------|
// 10px /* | 20px | 30px */
const VALUE_REGEXP = /\/\*\s*\|\s*(.*?)\s*\|\s*\*\//

// Regular expression for splitting 'val1  | val2 |  val3'
// kind of string into an array of values: [val1, val2, val3]
const SPLIT_REGEXP = /\s*\|\s*/

const defaults = {
  breakpoints: [
    '480px',
    '768px',
    '1024px',
    '1200px',
  ]
}

module.exports = postcss.plugin(pkg.name, (options = {}) => {
  const settings = Object.assign({}, defaults, options)
  const breakpoints = settings.breakpoints

  return css => {
    css.walkRules(rule => {
      const breakpointTuples = breakpoints.map((bp, i) => [i, []])
      const allDecls = new Map(breakpointTuples)

      rule.walkDecls(decl => {
        const rawValue = decl.raw('value')

        // When we create new declarations
        // they don't have raw value
        if (!rawValue || !rawValue.raw) return

        const responsiveValuesMatch = rawValue.raw.match(VALUE_REGEXP)

        if (!responsiveValuesMatch) return

        const responsiveValuesString = responsiveValuesMatch[1]

        if (!responsiveValuesString) return

        // e.g. ['10px', 'x', 10px]
        const responsiveValues = responsiveValuesString
          .split(SPLIT_REGEXP)
          .filter(Boolean)

        if (!responsiveValues.length) return

        if (responsiveValues.length > breakpoints.length) {
          throw new Error(
            'Responsive values number is greater than breakpoints number'
          )
        }

        responsiveValues.forEach((responsiveValue, i) => {
          if (responsiveValue === 'x') return

          const newDecl = postcss.decl({
            prop: decl.prop,
            value: responsiveValue,
          })

          allDecls.get(i).push(newDecl);
        })
      })

      let prevMediaQuery = null

      allDecls.forEach((newDecls, key) => {
        if (!newDecls.length) return

        const mediaQuery = postcss.atRule({
          name: 'media',
          params: `(min-width: ${breakpoints[key]})`,
        })

        const newRule = postcss.rule({
          selector: rule.selector,
        })

        newDecls.forEach(newDecl => {
          newRule.append(newDecl)
        })

        mediaQuery.append(newRule)

        if (prevMediaQuery) {
          prevMediaQuery.after(mediaQuery)
        } else {
          rule.after(mediaQuery)
        }

        prevMediaQuery = mediaQuery
      });
    })
  }
});