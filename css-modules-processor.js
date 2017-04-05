import path from 'path';
import PathHelpers from 'meteor-build-plugin-helper-path-helpers';
import Processor from 'meteor-compiler-processor';
import checkNpmPackage from 'meteor-build-plugin-helper-check-npm-package';

export default class CssModulesProcessor extends Processor {
  constructor({ postcssParser, jsClassNamingTransforms = [], fileExtensions = ['mss'], ...otherOptions } = {}, compiler) {
    super('CSS Modules compilation', { ...otherOptions, fileExtensions }, compiler);
    this.cssModules = null;
    this.jsClassNamingTransforms = jsClassNamingTransforms;
    this.postcssParser = postcssParser;
    this._loadCssModules();
  }

  _loadCssModules() {
    const result = checkNpmPackage('postcss@5.x', 'meteor-css-modules') && checkNpmPackage('postcss-modules@0.6', 'meteor-css-modules');
    if (result !== true) return;

    this.cssModules = require('postcss-modules');
  }

  async _process(file, resultSoFar) {
    const plugins = [];
    if (resultSoFar.css === '') {
      console.log('cssm: aborting')
      return resultSoFar;
    }

    console.log(`${resultSoFar.filePath}.css`)
    const postcssOptions = {
      from: file.importPath,
      to: `${resultSoFar.filePath}.css`,
      map: { inline: false },
      parser: this.postcssParser ? require(this.postcssParser) : undefined,
    };
    const postcss = require('postcss');

    return await this._transpile(resultSoFar, postcss, plugins, postcssOptions, file);
  }

  _transpile(resultSoFar, postcss, plugins, postcssOptions, file) {
    const Loader = {
      fetch: (...args) => {
        console.log(...args);
        return this._importFile(file, ...args)
      },
      get finalSource() {
        return '';
      }
    };
    return new Promise((resolve, reject) => {
      const x = postcss([
        file.require('postcss-modules')({
          getJSON: (cssFilename, json) => {
            try {
              resultSoFar.cssModules = { ...(resultSoFar.cssModules || {}), ...this._transformTokens(json) };
            } catch (err) {
              console.log(err);
            }
          },
          generateScopedName(exportedName, filePath) {
            try {
              const path = require('path');
              let sanitisedPath = path.relative(PathHelpers.basePath, filePath).replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
              const filename = path.basename(filePath).replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
              sanitisedPath = sanitisedPath.replace(new RegExp(`_(${filename})$`), '__$1');
              console.log(`_${sanitisedPath}__${exportedName}`)
              return `_${sanitisedPath}__${exportedName}`;
            } catch (err) {
              console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
              console.log(err)
            }
          },
          Loader() {
            return Loader;
          }
        })
      ]).process(resultSoFar.css || file.contents, postcssOptions);
      x.then(function (postcssResult) {
        // console.log('cssm: processed')

        resultSoFar.css = postcssResult.css;
        resultSoFar.maps.css = postcssResult.map.toJSON();
        resultSoFar.js = `const styles = ${JSON.stringify(resultSoFar.cssModules)};\nexport { styles as default, styles };`;
        resolve(resultSoFar);
      })
      .catch(function (err) {
        console.log('###############################')
        console.log(err)
        reject(err)
      });
    });
  }

  _calculatePotentialImportPaths(importPath) {
    const potentialPaths = [importPath];
    const potentialFileExtensions = this.fileExtensions;

    if (!path.extname(importPath)) {
      potentialFileExtensions.forEach(extension => potentialPaths.push(`${importPath}.${extension}`));
    }
    if (path.basename(importPath)[0] !== '_') {
      [].concat(potentialPaths).forEach(potentialPath => potentialPaths.push(`${path.dirname(potentialPath)}/_${path.basename(potentialPath)}`));
    }

    return potentialPaths;
  }

  _setupPostcssModules(file, resultSoFar) {
    // console.log('%%%%%%%%%%%%%%%%%%%%%%%%')
    // console.log(this.cssModules)
    // console.log(JSON.stringify(this.cssModules({
    //   getJSON: (cssFilename, json) => {
    //     console.log('getjson')
    //     resultSoFar.cssModules = { ...(resultSoFar.cssModules || {}), ...this._transformTokens(json) };
    //   },
    //   generateScopedName(exportedName, filePath) {
    //     console.log('cssm: generateScopedName')
    //     try {
    //       const path = require('path');
    //       let sanitisedPath = path.relative(PathHelpers.basePath, filePath).replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
    //       const filename = path.basename(filePath).replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
    //       sanitisedPath = sanitisedPath.replace(new RegExp(`_(${filename})$`), '__$1');
    //       console.log(`_${sanitisedPath}__${exportedName}`)
    //       return `_${sanitisedPath}__${exportedName}`;
    //     } catch (err) {
    //       console.log('###############################')
    //       console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    //       console.log(err)
    //     }
    //   },
    // })))
    return require('postcss-modules')({
      getJSON: (cssFilename, json) => {
        console.log('getjson')
        resultSoFar.cssModules = { ...(resultSoFar.cssModules || {}), ...this._transformTokens(json) };
      },
      generateScopedName(exportedName, filePath) {
        console.log('cssm: generateScopedName')
        try {
          const path = require('path');
          let sanitisedPath = path.relative(PathHelpers.basePath, filePath).replace(/.*\{}[/\\]/, '').replace(/.*\{.*?}/, 'packages').replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
          const filename = path.basename(filePath).replace(/\.[^\.\/\\]+$/, '').replace(/[\W_]+/g, '_');
          sanitisedPath = sanitisedPath.replace(new RegExp(`_(${filename})$`), '__$1');
          console.log(`_${sanitisedPath}__${exportedName}`)
          debugger
          return `_${sanitisedPath}__${exportedName}`;
        } catch (err) {
          console.log('###############################')
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
          console.log(err)
        }
      },
    });
  }

  _transformTokens(tokens) {
    if (this.jsClassNamingTransforms.length) {
      return tokens;
    }

    let transformedTokens = {};
    let keys = Object.keys(tokens);
    keys.forEach(key => transformedTokens[this.jsClassNamingTransforms.reduce((result, transform) => require(transform)(result), key)] = tokens[key]);
    return transformedTokens;
  }

  async _importFile(rootFile, source, relativeTo, trace) {
    relativeTo = fixRelativePath(relativeTo);
    const originalPath = source.replace(/^["'](.*)["']$/, '$1');
    source = PathHelpers.getPathRelativeToFile(source, relativeTo);

    const result = await (this.compiler.importFile(source, rootFile));
    return result.processingResult.cssModules;

    function fixRelativePath(relativeTo) {
      return relativeTo.replace(/.*(\{.*)/, '$1').replace(/\\/g, '/');
    }
  }

};
