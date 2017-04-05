import { createReplacer } from 'regex-replacer';
import CssModulesProcessor from './css-modules-processor';

import jsonToRegex from 'json-to-regex';

import pluginOptionsLoader from './bp/options';
// import pluginOptionsLoader from 'meteor-build-plugin-options';

const optionsLoader = pluginOptionsLoader.registerPackage('cssModules', { getDefaultOptions, processOptions });

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
      extensions: ['css', 'm.css', 'mss'],
      filenames: [],
      ignorePaths: [],
      includePaths: [],
      outputJsFilePath: '{dirname}/{basename}{extname}',
      outputCssFilePath: '{dirname}/{basename}{extname}',
      passthroughPaths: [],
      enableServerSideRendering: false,
      enableWebRendering: true,
    },
    preprocessors: {
      'nathantreid:css-modules-scss': {
        extensions: ['scss', 'sass'],
        globalVariables: [],
      },
    },
    processor: {
      passthroughPaths: [],
      cssClassNamingConvention: {
        replacements: [],
      },
      jsClassNamingConvention: {
        camelCase: false,
      },
    },
    postcssPreProcessors: {},
    postcssPostProcessors: {},
    hash: null
  };
}

function processOptions(options) {
  processPassthroughPathExpressions(options.buildPlugin);

  return pluginOptions.options = options;

  function processPassthroughPathExpressions(options) {
    options.passthroughPaths = options.passthroughPaths.map(jsonToRegex);
  }
}
