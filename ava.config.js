export default {
  files: [
    './test/**/*.test.js'
  ],
  compileEnhancements: false,
  extensions: [
    'ts'
  ],
  require: [
    'ts-node/register',
    'source-map-support/register'
  ]
}
