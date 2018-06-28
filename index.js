/**
 * SVG manipulations using gulp, largely inspired and modified from
 * {@link https://github.com/shakyshane/gulp-svg-sprites#readme|gulp-svg-sprites}
 * @namespace gulp-svg-multitool
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
const getDispatcher = require("./lib/svg-dispatcher").getDispatcher;
const consolo = require("./lib/svg-console").getConSolo("Multitool Stream");
const PLUGIN_NAME = "gulp-svg-multitool";
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
const options = {
    async: false,
    symbols: false,
    jsonData: true,
    preview: false,
    pngFallback: false,
    pngPath: "",
    previewFile: "preview.html",
    previewPath: "",
    jsonFile: "svg-data.json",
    jsonPath: "",
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
  let p = pathValue.replace(/\/$/, "");
  let s = (p.length > 0) ? "/" : "";
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
  stream.push(new File({
      cwd:  "./",
      base: "./",
      path: dest,
      contents: buffer
  }));
}

/**
 * Misc helper func
 * @function writeFiles
 * @param {Stream} stream
 * @param {Object} config
 * @param {Object} data
 * @param {Function} cb
 * @memberof gulp-svg-multitool
 */
function writeFiles(stream, config, data, cb) {

  data.config = config;

  var promises = [];
  var template = "";
  var previewTemplate = "";

  if (!config.atlasFile) {
      cb(null);
  }
  if (config.symbols) {
      template = fs.readFileSync(__dirname + "/templates/symbols.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-symbols.html", "utf-8");
  } else {
      template = fs.readFileSync(__dirname + "/templates/defs.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-template.html", "utf-8");
  }
  const filePath = getCleanPath(config.atlasPath, config.atlasFile);
  makeTemplateFile(template, filePath, stream, data).then(function(output) {
      data.svgInline = output;
      if (config.preview) {
          const previewFilePath = getCleanPath(config.previewPath, config.previewFile);
          promises.push(makeTemplateFile(previewTemplate, previewFilePath, stream, data));
          Q.all(promises).then(cb);
      } else {
        cb(null);
      }
  });
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
  }catch (e) {
    deferred.reject(e);
    return deferred.promise;
  }

  const fileBuffer = new Buffer(out);
  makeFile(filePath, stream, fileBuffer);

  deferred.resolve(out);

  return deferred.promise;
}

/**
 * Handles json file creation primarily
 * @function jsonify
 * @param data
 * @param config
 * @return {Object}
 * @memberof gulp-svg-multitool
 */
function jsonify(stream, data, config, done) {

  if (config.jsonData) {
    const jsonBuildData = {};

    data.svg = data.svg.map(function(item) {
        if (config.jsonData) {
          jsonBuildData[item.name] = item.data;
        }
        return item;
    });

    const filePath = getCleanPath(config.jsonPath, config.jsonFile);
    const json = JSON.stringify(jsonBuildData);
    const fileBuffer = new Buffer(json);
    makeFile(filePath, stream, fileBuffer);
  }

  if (config.async) {
    return config.postProcess(data, config, done);
  }

  return config.postProcess(data, config);
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
  let p = pathValue.replace(/\/$/, "");
  let s = (p.length > 0) ? "/" : "";
  return `${p}${s}${fileValue}`;
}

module.exports = function(config) {

    config = _.merge(_.cloneDeep(options), config || {});

    const dispatcher = getDispatcher(config);

    consolo.log("Initialized");

    return through.obj(function(file, enc, cb) {

      var stream = this;
      var fileName = path.basename(file.path, path.extname(file.path));
      const stage2stamp = Date.now();
      consolo.log("File Added [" + fileName + "]");
      dispatcher.register(file);

      if (config.pngFallback) {
        const filePath = getCleanPath(config.pngPath, `${fileName}.png`);
        const fileBuffer = svg2png.sync(file.contents);
        makeFile(filePath, stream, fileBuffer);
      }

      cb(null);

    }, function(cb) {

      var stream = this;
      const stage3stamp = Date.now();
      consolo.log("Work Complete");
      dispatcher.compile(function(err, svgData) {
        if (config.async) {
          var onDone = function(data) {
            writeFiles(stream, config, data, cb.bind(null, null));
          };
          jsonify(stream, svgData, config, onDone);
        } else {
          var data = jsonify(stream, svgData, config);
          writeFiles(stream, config, data, cb.bind(null, null));
        }
      });
  });
};
