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
  comments: false,
  breakpoints: ['480px', '768px', '1024px', '1200px'],
}

module.exports = postcss.plugin(pkg.name, (options = {}) => {
  const settings = { ...defaults, ...options }
  const { breakpoints, comments } = settings

  return css => {
    css.walkRules(rule => {
      const breakpointTuples = breakpoints.map((bp, i) => [i, []])
      const allDecls = new Map(breakpointTuples)

      rule.walkDecls(decl => {
        const value = comments
          ? ((decl.raws || {}).value || {}).raw
          : decl.value

        if (!value) return

        let responsiveValuesString = value

        if (comments) {
          const responsiveValuesMatch = value.match(VALUE_REGEXP) || []
          // eslint-disable-next-line prefer-destructuring
          responsiveValuesString = responsiveValuesMatch[1]
        }

        // e.g. ['10px', 'x', 10px]
        const responsiveValues = responsiveValuesString
          .split(SPLIT_REGEXP)
          .filter(Boolean)

        const initialValue = comments ? decl.value : responsiveValues.shift()

        if (!responsiveValues.length) return

        // responsiveValues without initial value
        if (responsiveValues.length > breakpoints.length) {
          throw new Error(
            'Responsive values number is greater than breakpoints number',
          )
        }

        responsiveValues.forEach((responsiveValue, i) => {
          if (responsiveValue === 'x') return

          const newDecl = postcss.decl({
            prop: decl.prop,
            value: responsiveValue,
          })

          allDecls.get(i).push(newDecl)
        })

        // eslint-disable-next-line no-param-reassign
        decl.value = initialValue
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
      })
    })
  }
})
