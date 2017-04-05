/* globals Package */
Package.describe({
  name: 'nathantreid:css-modules',
  version: '3.0.0-alpha.0',
  summary: 'CSS modules implementation. CSS for components!',
  git: 'https://github.com/nathantreid/meteor-css-modules.git',
  documentation: 'README.md'
});


Package.registerBuildPlugin({
  name: 'css-modules',
  use: [
    'babel-compiler@6.14.1',
    'ecmascript@0.6.3',
    'caching-compiler@1.1.9',
    'nathantreid:css-modules-global@0.0.1',
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
    'meteor-compiler-processor': 'file:///c:\\projects\\npm\\meteor-compiler-processor',
    'json-to-regex': 'file:///c:\\projects\\npm\\json-to-regex',
    'meteor-build-plugin-helper-check-npm-package': '0.0.1',
    'meteor-build-plugin-helper-handle-css': 'file:///C:\\projects\\npm\\meteor-build-plugin-helper-handle-css',

    'p-reduce': '1.0.0',
    // 'meteor-build-plugin-options': '0.0.1',
  },
  sources: [
    'bp/options.js',
    'options.js',
    'css-modules-processor.js',
    'css-modules-compiler.js',
    'plugin.js'
  ]
});

Package.onUse(function (api) {
  api.versionsFrom('1.4.3.1');
  api.use('isobuild:compiler-plugin@1.0.0');
});
