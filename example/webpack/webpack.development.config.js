const { WebpackPluginServe } = require('webpack-plugin-serve')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { DIST_DIR } = require('./constants')
const baseConfig = require('./webpack.base.config')

module.exports = {
  ...baseConfig({ optimize: false }),
  plugins: [
    new HtmlWebpackPlugin({
      template: 'example/index.html',
    }),
    new WebpackPluginServe({
      port: 8000,
      host: 'localhost',
      static: [DIST_DIR],
    }),
  ],
  watch: true,
}
