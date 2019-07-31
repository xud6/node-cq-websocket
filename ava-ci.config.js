import BASE_CONFIG from './ava.config'

const TS_NODE_COMPILER_OPTIONS = {
  inlineSourceMap: true
}

export default {
  ...BASE_CONFIG,
  environmentVariables: {
    TS_NODE_COMPILER_OPTIONS: JSON.stringify(TS_NODE_COMPILER_OPTIONS)
  }
}
