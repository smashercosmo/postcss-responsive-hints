const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const postcssResponsiveHints = require('../../../src/index')

/**
 * @param {Object} options
 * @param {Boolean} options.optimize
 */
module.exports = ({ optimize }) => {
  return [
    {
      test: /\.css$/,
      exclude: /node_modules/,
      use: [
        optimize ? MiniCssExtractPlugin.loader : { loader: 'style-loader' },
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            modules: false,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            plugins: () => [postcssResponsiveHints({ comments: true })],
          },
        },
      ],
    },
  ]
}
