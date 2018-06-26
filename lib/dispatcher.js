/**
 * SVG Object
 * @namespace Dispatcher
 */
const _ = require("lodash");
const async = require("async");
const getSvgObject = require("./svg-object").getSvgObject;

const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} defaultConfig
 * @property {Boolean} defaultConfig.symbols - Use symbol blocks instead of defs
 * @property {Boolean} defaultConfig.jsonData - Generate JSON data from SVG files
 * @property {Boolean} defaultConfig.pngFallback - Generate PNG fallback images of each SVG
 * @property {Boolean} defaultConfig.asyncTransforms - Use async transforms
 * @property {String} defaultConfig.outputPath - Define the output path for generated files.
 * @property {String} defaultConfig.previewFile - Define the output path for generated files.
 * @property {String} defaultConfig.jsonFile - Define the output path for generated files.
 * @property {String} defaultConfig.svgOutputFile - Define the output path for generated files.
 * @property {Number} defaultConfig.padding - Add padding to sprite items
 * @property {Number} defaultConfig.baseSize - Set the base font-size for the icon element
 * @property {Number} defaultConfig.svgoConfig - Settings used by precompiler
 * @memberof (internal) svg-object
 */
const defaultConfig = {
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
    svgoConfig: {}
};
/**
 * @module Dispatcher
 */
function Dispatcher(config) {

    this._settings = _.extend(defaultConfig, config || {});
    this._registry = {};
    this._queue = [];
    this._queue.push(function (callback) {
      callback(null, {svg:[]});
    });
}

/**
 * Register an SVG file to be processed
 *
 * @return {Function} callback - Callback
 */
Dispatcher.prototype.register = function (file) {
  const self = this;
  const svgObject = getSvgObject(file, self._settings.svgoConfig);
  const id = svgObject.id;
  if (!self._registry[id]) {
    self._registry[id] = true;
    self._queue.push(function (data, callback) {
        svgObject.compile(function(err, svgData) {
          data.svg.push(svgData)
          callback(err, data);
        });
    });
  }
};

/**
 * @return {Function} callback - Callback
 */
Dispatcher.prototype.compile = function (callback) {
  const self = this;
  async.waterfall(self._queue, callback);
};

/**
 * @function getDispatcher
 * @param {Object} config - Usage settings
 * @return {Object} Dispatcher
 */
function getDispatcher(config) {

  return new Dispatcher(config);
}

module.exports.getDispatcher = getDispatcher;
