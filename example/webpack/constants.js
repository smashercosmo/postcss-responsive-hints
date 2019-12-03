const path = require('path')
const appRootPath = require('app-root-path')

const ROOT_DIR = appRootPath.toString()
const DIST_DIR = path.resolve(ROOT_DIR, 'example/dist')
const ENTRY = './example/src/index.js'

module.exports = {
  ROOT_DIR,
  DIST_DIR,
  ENTRY,
}
