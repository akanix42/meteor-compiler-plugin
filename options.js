import { createReplacer } from 'regex-replacer';

import pluginOptionsLoader from './bp/options';
// import pluginOptionsLoader from 'meteor-build-plugin-options';

const optionsLoader = pluginOptionsLoader.registerPackage('compiler', { getDefaultOptions, processOptions });


const pluginOptions = {};
pluginOptions.options = optionsLoader.loadOptions();

export { loadOptions as reloadOptions };
export default pluginOptions;

export function getHash() {
  return pluginOptions.options.hash;
}

function loadOptions() {
  return pluginOptions.options = optionsLoader.loadOptions();
}

function getDefaultOptions() {
  return {
    buildPlugin: {
      enableCache: true,
      enableProfiling: false,
      extensions: ['vue'],
      filenames: [],
      ignorePaths: [],
      includePaths: [],
      outputJsFilePath: '{dirname}/{basename}{extname}',
      outputCssFilePath: '{dirname}/{basename}{extname}',
      passthroughPaths: [],
      specificArchitecture: 'web',
    },
    processors: [
      ['meteor-scss', { handles: 'scss' }],
      // 'meteor-stylus',
      // 'meteor-less',
      'meteor-css-modules'
    ],
    hash: null
  };
}

function processOptions(options) {
  processPassthroughPathExpressions(options.buildPlugin);

  return pluginOptions.options = options;

  function processPassthroughPathExpressions(options) {
    if (!options.passthroughPaths) {
      options.passthroughPaths = [];
      return;
    }

    const createPatternRegExp = pattern => typeof pattern === 'string' ? new RegExp(pattern) : new RegExp(pattern[0], pattern[1]);
    options.passthroughPaths = options.passthroughPaths.map(createPatternRegExp);
  }

}
