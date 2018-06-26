/**
 * SVG manipulations using gulp, largely inspired and modified from gulp-svg-sprites
 * https://github.com/shakyshane/gulp-svg-sprites#readme
 * @namespace (internal) gulp-svg-multitool
 */
const through = require("through2");
const gutil = require("gulp-util");
const File = gutil.File;
const Q = require("q");
const _ = require("lodash");
const path = require("path");
const async = require("async");
const svg2png = require("svg2png");
const fs = require("fs");
const getDispatcher = require("./lib/Dispatcher").getDispatcher;
const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Stored RegExp patterns used for parsing svg file data
 * @constant {Object} PATTERNS
 * @property {RegExp} PATTERNS.tagInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgSymbolInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgDefsInner - RegExp pattern
 * @property {RegExp} PATTERNS.elementTags - RegExp pattern
 * @property {RegExp} PATTERNS.innerMarkup - RegExp pattern
 * @property {RegExp} PATTERNS.findChildren - RegExp pattern
 * @property {RegExp} PATTERNS.findTopLevel - RegExp pattern
 * @property {RegExp} PATTERNS.parseTags - RegExp pattern
 * @property {RegExp} PATTERNS.parseAttributes - RegExp pattern
 * @property {RegExp} PATTERNS.classDef - RegExp pattern
 * @property {RegExp} PATTERNS.classDefName - RegExp pattern
 * @property {RegExp} PATTERNS.classAttrib - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlock - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlockInner - RegExp pattern
 * @property {RegExp} PATTERNS.nan - RegExp pattern
 * @memberof (internal) gulp-svg-multitool
 */
const PATTERNS = {
    comments: /<!--[\s\S]*?-->/g,
    tagInner: /<(\w+)\s?[^>]*>([\w\W]*)<\/\1>/g,
    svgInner: /(?:<svg[^>]*>)([\w\W]*)(?:<\/svg>)/g,
    svgSymbolInner: /(?:<symbol[^>]*>)([\w\W]*)(?:<\/symbol>)/g,
    svgDefsInner: /(?:<defs[^>]*>)([\w\W]*)(?:<\/defs>)/g,
    elementTags: /<(\/?\w+)/g,
    innerMarkup: /<(\w+)\s?([^>]*)>([\w\W]*)<\/\1>/g,
    findChildren: /<(\w+)([^>]*)>([\w\d\s\W\S]*?)(?=<\/\1>)/,
    findTopLevel: /<\w+\s?([^>]*)>([^<]*)<\/[^>]*>/g,
    parseTags: /(?:<(\w+)\s?([^>]*)>)([\w\s]*)/g,
    parseAttributes: /([\w\-]+)\=\"([\s\w\d\-\.\(\)\{\}\#\!]+)\"/,
    classDef: /([\.\#]?[\w\d\-]+)(?:[\{\s])/g,
    classDefName: /(?![\.\#\}\s])([\w\d\-]+)(?=[\{\s])/g,
    classAttrib: /(?:class=[\"\"])([^\"\"]+)(?:[\"\"])/g,
    styleBlock: /(<style>.+<\/style>)/g,
    styleBlockInner: /(?:<style>)(.+)(?:<\/style>)/g,
    nan: /(NaN(\s)?)+/g
};

const FindChildren = new RegExp(PATTERNS.innerMarkup, "g");

let STYLE_STRING = "";
const SVG_STORE = {svg:[]};
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} options
 * @property {Boolean} options.symbols - Use symbol blocks instead of defs
 * @property {Boolean} options.jsonData - Generate JSON data from SVG files
 * @property {Boolean} options.pngFallback - Generate PNG fallback images of each SVG
 * @property {Boolean} options.asyncTransforms - Use async transforms
 * @property {String} options.outputPath - Define the output path for generated files.
 * @property {String} options.previewFile - Define the output path for generated files.
 * @property {String} options.jsonFile - Define the output path for generated files.
 * @property {String} options.svgOutputFile - Define the output path for generated files.
 * @property {Number} options.padding - Add padding to sprite items
 * @property {Number} options.baseSize - Set the base font-size for the icon element
 * @property {Function} options.transformData - Override the default data transforms
 * @property {Function} options.afterTransform - Apply additional data transforms AFTER the options
 * @memberof (internal) gulp-svg-multitool
 */
const options = {
    symbols: false,
    jsonData: true,
    preview: true,
    pngFallback: false,
    asyncTransforms: false,
    common: "icon",
    outputPath:   "./",
    previewFile: "preview.html",
    jsonFile: "svg-data.json",
    svgOutputFile: "atlas.svg",
    padding: 0,
    baseSize: 10,
    svgoConfig: {},
    transformData: transformData,
    afterTransform: function(data, config, done) {
        if (config.asyncTransforms) {
           return done(data);
        }
        return data;
    }
};
/**
 * Any last-minute data transformations before handing off to templates,
 * can be overridden by supplying a "transformData" option
 * @function transformData
 * @param data
 * @param config
 * @return {Object}
 * @memberof (internal) gulp-svg-multitool
 */
function transformData(stream, data, config, done) {

  STYLE_STRING = "";
  const jsonBuildData = {};

  data.svg = data.svg.map(function(item) {
      item.viewBox = "0 0 0 0";
      if (config.jsonData) {
        jsonBuildData[item.name] = item.props;
      }

      return item;
  });

  data.svg = data.svg.filter(function(item) { return item; });

  if (config.jsonData) {
    const jsonPath = `${config.outputPath}/${config.jsonFile}`;
    const json = JSON.stringify(jsonBuildData);
    makeFile(config.jsonFile, stream, json);
  }

  if (config.asyncTransforms) {
    return done(data);
  }
  return data;
}

/**
 * Helper for correct plugin errors
 * @function error
 * @param {Object} context
 * @param {String} msg
 * @memberof (internal) gulp-svg-multitool
 */
function error(context, msg) {
  context.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
}

/**
 * @function makeFile
 * @param {String} fileName
 * @param {Stream} stream
 * @param {*} data
 * @memberof (internal) gulp-svg-multitool
 */
function makeFile(fileName, stream, data) {
  const fileBuffer = new Buffer(data);
  const newFile = new File({
      cwd:  "./",
      base: "./",
      path: fileName,
      contents: fileBuffer
  });
  stream.push(newFile);
}

/**
 * @function makeTemplateFile
 * @param {File} template
 * @param {String} fileName
 * @param {Stream} stream
 * @param {Object} data
 * @return {Promise.promise|*}
 * @memberof (internal) gulp-svg-multitool
 */
function makeTemplateFile(template, fileName, stream, data) {

  var deferred = Q.defer();
  var id = _.uniqueId();
  var out = "";

  try {
    var compiled = _.template(template);
    out = compiled(data);
  }catch (e) {
    deferred.reject(e);
    return deferred.promise;
  }

  const fileBuffer = new Buffer(out);
  const newFile = new File({
      cwd:  "./",
      base: "./",
      path: fileName,
      contents: fileBuffer
  });

  stream.push(newFile);
  deferred.resolve(out);

  return deferred.promise;
}

/**
 * @function writeFiles
 * @param {Stream} stream
 * @param {Object} config
 * @param {Object} data
 * @param {Function} cb
 * @memberof (internal) gulp-svg-multitool
 */
function writeFiles(stream, config, data, cb) {

  data.config = config;

  var promises = [];
  var template = "";
  var previewTemplate = "";

  if (!config.svgOutputFile) {
      cb(null);
  }
  if (config.symbols) {
      template = fs.readFileSync(__dirname + "/templates/symbols.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-symbols.html", "utf-8");
  } else {
      template = fs.readFileSync(__dirname + "/templates/defs.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-template.html", "utf-8");
  }
  makeTemplateFile(template, config.svgOutputFile, stream, data).then(function(output) {
      data.svgInline = output;
      if (config.preview) {
          promises.push(makeTemplateFile(previewTemplate, config.previewFile, stream, data));
          Q.all(promises).then(cb);
      } else {
        cb(null);
      }
  });
}

/**
 * SVG manipulations using gulp, largely inspired and modified from gulp-svg-sprites
 * https://github.com/shakyshane/gulp-svg-sprites#readme
 * @module gulp-svg-multitool
 */

/** Compile SVGs. */
module.exports = function(config) {

    config = _.merge(_.cloneDeep(options), config || {});

    // SVG_STORE.svg = [];
    // SVG_STORE.svgStyle = "";

    const dispatcher = getDispatcher(config);

    return through.obj(function(file, enc, cb) {

      var stream = this;
      var fileName = path.basename(file.path, path.extname(file.path));
      // var fileContents = file.contents.toString();
      // var newData = {name: fileName, data: fileContents};
      // SVG_STORE.svg.push(newData);
      dispatcher.register(file);
      if (config.pngFallback) {
        stream.push(new File({
            cwd:  "./",
            base: "./",
            path: `${fileName}.png`,
            contents: svg2png.sync(file.contents)
        }));
      }

      cb(null);

    }, function(cb) {

      var stream = this;
      // console.log("Plugin Wrapping Up");
      // console.log(SVG_STORE);
      dispatcher.compile(function(err, svgData) {
        var onDoneAfterTransformData = function(data) {
          writeFiles(stream, config, data, cb.bind(null, null));
        };

        var onDoneTransformData = function(data) {
          config.afterTransform(data, config, onDoneAfterTransformData);
        };

        if (config.asyncTransforms) {
          config.transformData(stream, svgData, config, onDoneTransformData);
        } else {
          var data = config.transformData(stream, svgData, config);
          data = config.afterTransform(data, config);
          writeFiles(stream, config, data, cb.bind(null, null));
        }
      });
  });
};
