/* globals JSON */
import path from 'path';
import { MultiFileCachingCompiler } from 'meteor/caching-compiler';
import { Meteor } from 'meteor/meteor';
import { Babel } from 'meteor/babel-compiler';
import PathHelpers from 'meteor-build-plugin-helper-path-helpers';
import recursiveUnwrapped from 'recursive-readdir';
import IncludedFile from 'meteor-build-plugin-helper-included-file';
import { reloadOptions } from './options';
// const pluginOptions = pluginOptionsWrapper.options;

// import getOutputPath from './get-output-path';
// import profile from './helpers/profile';
// import ImportPathHelpers from './helpers/import-path-helpers';
import { stripIndent, stripIndents } from 'common-tags';
//
// let pluginOptions = pluginOptionsWrapper.options;
const recursive = Meteor.wrapAsync(recursiveUnwrapped);

export default class Compiler extends MultiFileCachingCompiler {
  constructor(compilerName, settingsFieldName = compilerName) {
    super({
      compilerName: compilerName,
      defaultCacheSize: 1024 * 1024 * 10
    });
    this.profilingResults = {
      processFilesForTarget: null,
      _transpileScssToCss: null,
      _transpileCssModulesToCss: null
    };

    this.processors = null;
    this.filesByName = null;
    this.optionsHash = null;
    this.pluginOptions = null;
    this.buildPluginOptions = null;
    this.memCache = new Map();
  }

  processFilesForTarget(files) {
    this.pluginOptions = reloadOptions();
    let buildPluginOptions = this.buildPluginOptions = this.pluginOptions.buildPlugin;
    if (!buildPluginOptions.enableCache) {
      this._cache.reset();
    }
    const start = profile();
    this.optionsHash = this.pluginOptions.hash;

    files = removeFilesFromExcludedFolders(files);
    files = addFilesFromIncludedFolders(files);

    this._setupPreprocessors(files);
    this.filesByName = null;

    super.processFilesForTarget(files);


    function removeFilesFromExcludedFolders(files) {
      if (!buildPluginOptions.ignorePaths.length) {
        return files;
      }

      const ignoredPathsRegExps = buildPluginOptions.ignorePaths.map(pattern => new RegExp(pattern));
      const shouldKeepFile = file => !ignoredPathsRegExps.some(regex => regex.test(file.getPathInPackage()));

      return files.filter(shouldKeepFile);
    }

    function addFilesFromIncludedFolders(files) {
      buildPluginOptions.includePaths.map(folderPath => {
        const includedFiles = recursive(folderPath, [onlyAllowExtensionsHandledByPlugin]);
        files = files.concat(includedFiles.map(filePath => new IncludedFile(filePath.replace(/\\/g, '/'), files[0])));

        function onlyAllowExtensionsHandledByPlugin(file, stats) {
          let extension = path.extname(file);
          if (extension) {
            extension = extension.substring(1);
          }
          return !stats.isDirectory() && buildPluginOptions.extensions.indexOf(extension) === -1;
        }
      });
      return files;
    }
  }

  _setupPreprocessors(files) {
    this.processors = this.pluginOptions.processors.map(processorEntry => {
      let processorPackage, options;
      if (typeof processorEntry === 'string') {
        processorPackage = processorEntry;
      } else if (Array.isArray(processorEntry)) {
        processorPackage = processorEntry[0];
        options = processorEntry[1];
      }

      const Processor = files[0].require(processorPackage).default;
      return new Processor(options, this)
    });
  }

  isRoot(inputFile) {
    if ('isRoot' in inputFile) {
      return inputFile.isRoot;
    }

    this._setProcessors(inputFile);

    let isRoot = null;
    for (let i = 0; i < inputFile.processors.length; i++) {
      let processor = inputFile.processors[i];
      if (processor.isRoot(inputFile)) {
        inputFile.isRoot = true;
        return true;
      }
      isRoot = false;
    }

    /* If no processors handle this file, it's excluded from processing. */
    inputFile.isRoot = isRoot === null ? false : isRoot;
    return inputFile.isRoot;
  }

  _setProcessors(inputFile) {
    const fileExtension = path.extname(inputFile.getPathInPackage()).substring(1);
    inputFile.processors = [];
    for (let i = 0; i < this.processors.length; i++) {
      let processor = this.processors[i];
      if (processor.handlesFileExtension(fileExtension)) {
        inputFile.processors.push(processor);
      }
    }
  }

  compileOneFile(inputFile, filesByName) {
    return Promise.await(this._compileOneFile(inputFile, filesByName));
  }

  async _compileOneFile(inputFile, filesByName) {
    if (this.memCache.has(inputFile)) {
      console.log(`Using cache for ${inputFile.getPathInPackage()}`);
      return this.memCache.get(inputFile);
    }
    this._updateFilesByName(filesByName);

    this._prepInputFile(inputFile);

    const pReduce = require('p-reduce');
    const initialResult = { maps: {}, filePath: inputFile.getPathInPackage(), css: '', js: '' };
    const processingResult = await pReduce(inputFile.processors, async function (result, processor) {
      return await processor.process(inputFile, result);
    }, initialResult);

    const compileResult = this._generateOutput(inputFile, processingResult);
    const dataToReturn = { compileResult, referencedImportPaths: inputFile.referencedImportPaths, processingResult, inputFile };
    this.memCache.set(inputFile, dataToReturn);
    return dataToReturn;
  }

  _generateOutput(inputFile, processingResult) {
    const filePath = processingResult.filePath;
    const isLazy = filePath.split('/').indexOf('imports') >= 0;
    const shouldAddStylesheet = inputFile.getArch().indexOf('web') === 0;
    const finalResult = { isLazy, filePath };
    let stylesheetCode = '', importsCode = '';
    if (!isLazy && shouldAddStylesheet && processingResult.css) {
      finalResult.stylesheet = processingResult.css;
    } else {
      if (inputFile.imports.length) {
        importsCode = inputFile.imports.map(importPath => `import '${importPath}';`).join('\n');
      }
      stylesheetCode = stripIndent`
         import modules from 'meteor/modules';
				 modules.addStyles(${JSON.stringify(processingResult.css)});`;
    }
    //
    // const tokensCode = inputFile.js
    //   ? stripIndent`
    //      const styles = ${JSON.stringify(inputFile.tokens)};
    //      export { styles as default, styles };`
    //   : '';

    if (importsCode || stylesheetCode || processingResult.js) {
      finalResult.javascript = tryBabelCompile(stripIndents`
					${importsCode}
					${stylesheetCode}
					${processingResult.js}`
      );
    }

    return finalResult;

    function tryBabelCompile(code) {
      try {
        return Babel.compile(code).code;
      } catch (err) {
        console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        console.error(`Processing Step: Babel compilation`);
        console.error(`Unable to compile ${filePath}\n${err}`);
        console.error('Source: \n// <start of file>\n', code.replace(/^\s+/gm, ''));
        console.error(`// <end of file>`);
        console.error(`\n/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
        throw err;
      }
    }
  }

  _updateFilesByName(filesByName) {
    if (this.filesByName) return;
    this.filesByName = filesByName;
    filesByName._get = filesByName.get;
    filesByName.get = (key) => {
      const file = filesByName._get(key);
      this._prepInputFile(file);
      this.isRoot(file);
      return file;
    };
  }

  _prepInputFile(file) {
    if (file.isPrepped) {
      return;
    }

    file.imports = [];
    file.referencedImportPaths = [];
    file.contents = file.getContentsAsString() || '';
    file.rawContents = file.contents;
    file.isPrepped = true;
  }

  addCompileResult(file, result) {
    if (result.stylesheet) {
      file.addStylesheet({
        data: result.stylesheet,
        path: `${result.filePath}.css`,
        sourcePath: `${result.filePath}.css`,
        sourceMap: JSON.stringify(result.sourceMap),
        lazy: false
      });
    }

    if (result.javascript) {
      file.addJavaScript({
        data: result.javascript,
        path: `${result.filePath}.js`,
        sourcePath: result.filePath,
        lazy: result.isLazy,
        bare: false,
      });
    }
  }

  compileResultSize(compileResult) {
    return JSON.stringify(compileResult).length;
  }

  getCacheKey(inputFile) {
    return `${this.optionsHash}...${inputFile.getSourceHash()}`;
  }

  getAbsoluteImportPath(inputFile) {
    const importPath = PathHelpers.getPathInPackage(inputFile);
    inputFile.importPath = importPath;
    return importPath;
  }

  async importFile(filePath, rootFile) {
    try {
      filePath = this._discoverImportPath(filePath);
      let file;
      if (this.filesByName.has(filePath)) {
        file = this.filesByName.get(filePath);
      } else {
        file = this._createIncludedFile(filePath, rootFile);
      }

      const result = await this._compileOneFile(file, this.filesByName);
      return result;
    } catch (err) {
      console.error(err.message)
      console.error(err.stack)
      throw err;
    }
  }

  _discoverImportPath(filePath) {
    let potentialPaths = Array.isArray(filePath) ? filePath : [filePath];

    for (let i = 0,
           potentialPath = potentialPaths[i]; i < potentialPaths.length; i++, potentialPath = potentialPaths[i]) {
      if (this.filesByName.has(potentialPath) || (fs.existsSync(potentialPaths[i]) && fs.lstatSync(potentialPaths[i]).isFile())) {
        return potentialPath;
      }
    }

    throw new Error(`File not found at any of the following paths: ${JSON.stringify(potentialPaths)}`);
  }

  _createIncludedFile(importPath, rootFile) {
    console.log('create included file')
    const file = new IncludedFile(importPath, rootFile);
    file.importPath = importPath;

    file.prepInputFile().await();
    this.filesByName.set(importPath, file);
    this._setProcessors(file);
  }
};

