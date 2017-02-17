import R from 'ramda';
import sha1 from 'sha1';
import cjson from 'cjson';
import path from 'path';
import fs from 'fs';
import PathHelpers from 'meteor-build-plugin-helper-path-helpers';

const optionsFilePath = path.join(PathHelpers.basePath || '', 'package.json');

const registeredPackages = {};
function registerPackage(packageName, options) {
  registeredPackages[packageName] = options;

  return { loadOptions: loadOptions.bind(null, packageName, options) };
}

export { registerPackage };

function loadOptions(packageName, packageOptionsLoader) {
  let options = null;
  if (fs.existsSync(optionsFilePath)) {
    options = cjson.load(optionsFilePath)[packageName];
  }
  options = options || {};

  options = R.merge(packageOptionsLoader.getDefaultOptions(), options || {});
  options = packageOptionsLoader.processOptions(options);

  options.hash = sha1(JSON.stringify(options));

  return options;
}
