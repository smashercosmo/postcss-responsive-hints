const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const baseConfig = require('./webpack.base.config')

module.exports = {
  ...baseConfig({ optimize: true }),
  plugins: [
    new HtmlWebpackPlugin({
      template: 'example/index.html',
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
}
