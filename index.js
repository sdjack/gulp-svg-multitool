/**
 * SVG manipulations using gulp, largely inspired and modified from
 * {@link https://github.com/shakyshane/gulp-svg-sprites#readme|gulp-svg-sprites}
 * @namespace gulp-svg-multitool
 */
var through = require("through2");
var gutil = require("gulp-util");
var File = gutil.File;
var Q = require("q");
var _ = require("lodash");
var path = require("path");
var async = require("async");
var svg2png = require("svg2png");
var fs = require("fs");
var getDispatcher = require("./lib/svg-dispatcher").getDispatcher;
var consolo = require("./lib/svg-console").getConSolo("Multitool Stream");
var PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} options
 * @property {Boolean} options.async - Use async processing
 * @property {Boolean} options.symbols - Use symbol blocks instead of defs
 * @property {Boolean} options.jsonData - Generate JSON data from SVG files
 * @property {Boolean} options.pngFallback - Generate PNG fallback images of each SVG
 * @property {String} options.pngPath - Define the png output file path.
 * @property {String} options.previewFile - Define the preview output file name.
 * @property {String} options.previewPath - Define the preview output file path.
 * @property {String} options.jsonFile - Define the json output file name.
 * @property {String} options.jsonPath - Define the json output file path.
 * @property {String} options.atlasFile - Define the svg output file name.
 * @property {String} options.atlasPath - Define the svg output file path.
 * @property {Function} options.postProcess - Apply additional data changes AFTER core processes
 * @memberof gulp-svg-multitool
 */
var options = {
  async: false,
  symbols: false,
  optimized: false,
  optimizedPath: "dist",
  pngFallback: false,
  pngPath: "",
  preview: false,
  previewFile: "preview.html",
  previewPath: "",
  jsonData: false,
  jsonFile: "svg-data.json",
  jsonPath: "",
  atlasData: true,
  atlasFile: "svg-atlas.svg",
  atlasPath: "",
  svgoConfig: {},
  postProcess: function(data, config, done) {
    if (config.async) {
      return done(data);
    }
    return data;
  }
};

/**
 * Helper for correct plugin errors
 * @function error
 * @param {Object} context
 * @param {String} msg
 * @memberof gulp-svg-multitool
 */
function error(context, msg) {
  context.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
}

/**
 * Path correction helper
 * @function getCleanPath
 * @param {String} pathValue
 * @param {Stream} fileValue
 * @return {String} Usable path
 * @memberof gulp-svg-multitool
 */
function getCleanPath(pathValue, fileValue) {
  var p = pathValue.replace(/\/$/, "");
  var s = p.length > 0 ? "/" : "";
  return `${p}${s}${fileValue}`;
}

/**
 * Misc helper func
 * @function makeFile
 * @param {String} dest
 * @param {Stream} stream
 * @param {*} buffer
 * @memberof gulp-svg-multitool
 */
function makeFile(dest, stream, buffer) {
  stream.push(
    new File({
      cwd: "./",
      base: "./",
      path: dest,
      contents: buffer
    })
  );
}

/**
 * Misc helper func
 * @function makeTemplateFile
 * @param {File} template
 * @param {String} filePath
 * @param {Stream} stream
 * @param {Object} data
 * @return {Promise.promise|*}
 * @memberof gulp-svg-multitool
 */
function makeTemplateFile(template, filePath, stream, data) {
  var deferred = Q.defer();
  var id = _.uniqueId();
  var out = "";

  try {
    var compiled = _.template(template);
    out = compiled(data);
  } catch (e) {
    deferred.reject(e);
    // consolo.log(e);
    consolo.log(data);
    return deferred.promise;
  }

  var fileBuffer = new Buffer(out);
  makeFile(filePath, stream, fileBuffer);

  deferred.resolve(out);

  return deferred.promise;
}

/**
 * Misc helper func
 * @function writeAtlasFiles
 * @param {Stream} stream
 * @param {Object} data
 * @param {Object} config
 * @param {Function} cb
 * @memberof gulp-svg-multitool
 */
function writeAtlasFiles(stream, data, config, cb) {
  data.config = config;

  if (!config.atlasData || !config.atlasFile) {
    cb(null);
  } else {
    var promises = [];
    var template = "";
    var previewTemplate = "";

    if (config.symbols) {
      template = fs.readFileSync(__dirname + "/templates/symbols.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-symbols.html", "utf-8");
    } else {
      template = fs.readFileSync(__dirname + "/templates/defs.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-template.html", "utf-8");
    }

    var filePath = getCleanPath(config.atlasPath, config.atlasFile);

    makeTemplateFile(template, filePath, stream, data).then(function(output) {
      data.svgInline = output;
      if (config.preview) {
        var previewFilePath = getCleanPath(config.previewPath, config.previewFile);
        promises.push(makeTemplateFile(previewTemplate, previewFilePath, stream, data));
        Q.all(promises).then(cb);
      } else {
        cb(null);
      }
    });
  }
}

/**
 * Misc helper func
 * @function writeOptimizedFiles
 * @param {Stream} stream
 * @param {Object} data
 * @param {Object} config
 * @param {Function} cb
 * @return {Object}
 * @memberof gulp-svg-multitool
 */
function writeOptimizedFiles(stream, data, config, cb) {
  if (config.optimized) {
    data.svg = data.svg.map(function(item) {
      if (item && item.name) {
        var filePath = getCleanPath(config.optimizedPath, `${item.name}.svg`);
        var template = fs.readFileSync(__dirname + "/templates/optimized.svg", "utf-8");
        makeTemplateFile(template, filePath, stream, item);
      }
      return item;
    });
  }

  if (cb) {
    return cb(data);
  }

  return data;
}

/**
 * Handles json file creation primarily
 * @function writeJsonFile
 * @param {Stream} stream
 * @param {Object} data
 * @param {Object} config
 * @param {Function} cb
 * @return {Object}
 * @memberof gulp-svg-multitool
 */
function writeJsonFile(stream, data, config, cb) {
  if (config.jsonData) {
    var jsonBuildData = {};

    data.svg = data.svg.map(function(item) {
      if (config.jsonData && item && item.name) {
        jsonBuildData[item.name] = item.data;
      }
      return item;
    });

    var filePath = getCleanPath(config.jsonPath, config.jsonFile);
    var json = JSON.stringify(jsonBuildData);
    var fileBuffer = new Buffer(json);
    makeFile(filePath, stream, fileBuffer);
  }

  if (cb) {
    return cb(data);
  }

  return data;
}

/**
 * Path correction helper
 * @function getCleanPath
 * @param {String} pathValue
 * @param {Stream} fileValue
 * @return {String} Usable path
 * @memberof gulp-svg-multitool
 */
function getCleanPath(pathValue, fileValue) {
  var p = pathValue.replace(/\/$/, "");
  var s = p.length > 0 ? "/" : "";
  return `${p}${s}${fileValue}`;
}

module.exports = function(config) {
  config = _.merge(_.cloneDeep(options), config || {});

  var dispatcher = getDispatcher(config);
  consolo.log("Working...");

  return through.obj(
    function(file, enc, cb) {
      var stream = this;
      var fileName = path.basename(file.path, path.extname(file.path));
      var stage2stamp = Date.now();
      dispatcher.register(file);

      if (config.pngFallback) {
        var filePath = getCleanPath(config.pngPath, `${fileName}.png`);
        var fileBuffer = svg2png.sync(file.contents, { width: 300 });
        makeFile(filePath, stream, fileBuffer);
      }

      cb(null);
    },
    function(cb) {
      var stream = this;
      var stage3stamp = Date.now();
      dispatcher.compile(function(err, svgData) {
        var tertiary = function(data) {
          writeAtlasFiles(stream, data, config, cb.bind(null, null));
          consolo.log("Work Complete");
        };
        var secondary = function(data) {
          writeOptimizedFiles(stream, data, config, tertiary);
        };
        writeJsonFile(stream, svgData, config, secondary);
      });
    }
  );
};
