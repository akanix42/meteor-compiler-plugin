/* globals Package */
Package.describe({
  name: 'nathantreid:compiler',
  version: '0.0.1',
  summary: 'Extendable build plugin for Meteor',
  git: 'https://github.com/nathantreid/meteor-vue.git',
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: 'vue',
  use: [
    'babel-compiler@6.9.1_1',
    'ecmascript@0.5.8_1',
    'caching-compiler@1.1.7_1',
    'underscore@1.0.9',
  ],
  npmDependencies: {
    'meteor-build-plugin-helper-included-file': '0.0.2',
  },
  sources: [
    'options.js',
    'plugin.js'
  ]
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.1');
  api.use('isobuild:compiler-plugin@1.0.0');
});
