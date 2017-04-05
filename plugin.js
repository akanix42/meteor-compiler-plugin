/* globals Plugin */
import handleCssExtension from 'meteor-build-plugin-helper-handle-css';

import CssModulesCompiler from './css-modules-compiler';

import pluginOptionsWrapper from './options';
const pluginOptions = pluginOptionsWrapper.options;

if(pluginOptions.buildPlugin.extensions.includes('css')) {
  handleCssExtension(Plugin, 'nathantreid:css-modules', registerCompiler);
} else {
  registerCompiler();
}

function registerCompiler() {
  console.log('register compiler')
  Plugin.registerCompiler({
    extensions: pluginOptions.buildPlugin.extensions,
    archMatching: pluginOptions.buildPlugin.specificArchitecture,
    filenames: pluginOptions.buildPlugin.filenames
  }, function () {
    return new CssModulesCompiler();
  });
}
