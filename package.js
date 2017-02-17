/* globals Package */
Package.describe({
  name: 'nathantreid:compiler',
  version: '0.0.1',
  summary: 'Extendable build plugin for Meteor',
  git: 'https://github.com/nathantreid/meteor-vue.git',
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: 'compiler',
  use: [
    'babel-compiler@6.9.1_1',
    'ecmascript@0.5.8_1',
    'caching-compiler@1.1.7_1',
    'underscore@1.0.9',
  ],
  npmDependencies: {
    // 'app-module-path': '2.2.0',
    'cjson': '0.5.0',
    'common-tags': '1.4.0',
    'meteor-build-plugin-helper-included-file': '0.0.2',
    'meteor-build-plugin-helper-path-helpers': '0.0.1',
    'ramda': '0.23.0',
    'recursive-readdir': '2.1.0',
    'regex-replacer': '0.0.1',
    'sha1': '1.1.1',
    /* required for sha1 to work in build plugin ??? */
    'crypt': '0.0.2',
    'charenc': '0.0.2',
    /* end required for sha1 */
    // 'meteor-scss': 'file:///D:\\projects\\npm\\meteor-scss',

    // 'meteor-build-plugin-options': '0.0.1',
  },
  sources: [
    'bp/options.js',
    'options.js',
    'compiler.js',
    'plugin.js'
  ]
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.1');
  api.use('isobuild:compiler-plugin@1.0.0');
});
