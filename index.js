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
const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} options
 * @property {Boolean} options.symbols - Use symbol blocks instead of defs
 * @property {Boolean} options.jsonData - Generate JSON data from SVG files
 * @property {Boolean} options.pngFallback - Generate PNG fallback images of each SVG
 * @property {Boolean} options.async - Use async processing
 * @property {String} options.outputPath - Define the output path for generated files.
 * @property {String} options.previewFile - Define the output path for generated files.
 * @property {String} options.jsonFile - Define the output path for generated files.
 * @property {String} options.svgOutputFile - Define the output path for generated files.
 * @property {Number} options.padding - Add padding to sprite items
 * @property {Number} options.baseSize - Set the base font-size for the icon element
 * @property {Function} options.postProcess - Apply additional data changes AFTER core processes
 * @memberof gulp-svg-multitool
 */
const options = {
    symbols: false,
    jsonData: true,
    preview: true,
    pngFallback: false,
    async: false,
    common: "icon",
    outputPath:   "./",
    previewFile: "preview.html",
    jsonFile: "svg-data.json",
    svgOutputFile: "atlas.svg",
    padding: 0,
    baseSize: 10,
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
 * Misc helper func
 * @function makeFile
 * @param {String} fileName
 * @param {Stream} stream
 * @param {*} data
 * @memberof gulp-svg-multitool
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
 * Misc helper func
 * @function makeTemplateFile
 * @param {File} template
 * @param {String} fileName
 * @param {Stream} stream
 * @param {Object} data
 * @return {Promise.promise|*}
 * @memberof gulp-svg-multitool
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

    const jsonPath = `${config.outputPath}/${config.jsonFile}`;
    const json = JSON.stringify(jsonBuildData);
    makeFile(config.jsonFile, stream, json);
  }

  if (config.async) {
    return config.postProcess(data, config, done);
  }

  return config.postProcess(data, config);
}

module.exports = function(config) {

    config = _.merge(_.cloneDeep(options), config || {});

    const dispatcher = getDispatcher(config);

    return through.obj(function(file, enc, cb) {

      var stream = this;
      var fileName = path.basename(file.path, path.extname(file.path));
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
