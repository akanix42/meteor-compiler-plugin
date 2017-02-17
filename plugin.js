/* globals Plugin */
import Compiler from './compiler';

import pluginOptionsWrapper from './options';
const pluginOptions = pluginOptionsWrapper.options;

Plugin.registerCompiler({
  extensions: pluginOptions.buildPlugin.extensions,
  archMatching: pluginOptions.buildPlugin.specificArchitecture,
  filenames: pluginOptions.buildPlugin.filenames
}, function () {
  return new Compiler('compiler');
});
