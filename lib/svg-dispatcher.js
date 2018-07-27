/**
 * Dispatch module used in svg conversion
 * @namespace svg-dispatcher
 */
const _ = require("lodash");
const async = require("async");
const getSvgObject = require("./svg-object").getSvgObject;

const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} defaultConfig
 * @memberof svg-dispatcher
 */
const defaultConfig = {
  plugins: [
    {
      cleanupAttrs: true
    },
    {
      removeDoctype: true
    },
    {
      removeXMLProcInst: true
    },
    {
      removeComments: true
    },
    {
      removeMetadata: true
    },
    {
      removeTitle: true
    },
    {
      removeDesc: true
    },
    {
      removeUselessDefs: true
    },
    {
      removeEditorsNSData: true
    },
    {
      removeEmptyAttrs: true
    },
    {
      removeHiddenElems: true
    },
    {
      removeEmptyText: true
    },
    {
      removeEmptyContainers: true
    },
    {
      removeViewBox: false
    },
    {
      cleanupEnableBackground: true
    },
    {
      convertStyleToAttrs: true
    },
    {
      convertColors: true
    },
    {
      convertPathData: true
    },
    {
      convertTransform: true
    },
    {
      removeUnknownsAndDefaults: false
    },
    {
      removeNonInheritableGroupAttrs: true
    },
    {
      removeUselessStrokeAndFill: true
    },
    {
      removeUnusedNS: true
    },
    {
      cleanupIDs: true
    },
    {
      cleanupNumericValues: true
    },
    {
      moveElemsAttrsToGroup: true
    },
    {
      moveGroupAttrsToElems: true
    },
    {
      collapseGroups: true
    },
    {
      removeRasterImages: false
    },
    {
      mergePaths: true
    },
    {
      convertShapeToPath: true
    },
    {
      sortAttrs: true
    },
    {
      removeDimensions: true
    }
  ]
};
/**
 * Dispatch module used in svg conversion
 * @function Dispatcher
 * @param {Object} config - Usage settings
 * @memberof svg-dispatcher
 */
function Dispatcher(config) {
  this._settings = _.extend(defaultConfig, config || {});
  this._registry = {};
  this._queue = [];
  this._queue.push(function(callback) {
    callback(null, { svg: [] });
  });
}

/**
 * Register an SVG file to be processed
 * @function register
 * @param {File} file - The SVG file
 * @return {Function} callback - Callback
 * @memberof svg-dispatcher
 */
Dispatcher.prototype.register = function(file) {
  const self = this;
  const svgObject = getSvgObject(file, self._settings);
  const id = svgObject.id;
  if (!self._registry[id]) {
    self._registry[id] = true;
    self._queue.push(function(data, callback) {
      svgObject.compile(function(err, svgData) {
        data.svg.push(svgData);
        callback(err, data);
      });
    });
  }
};

/**
 * Run all queued processes
 * @function compile
 * @param {Function} callback - Post compile callback
 * @memberof svg-dispatcher
 */
Dispatcher.prototype.compile = function(callback) {
  const self = this;
  async.waterfall(self._queue, callback);
};

/**
 * Misc helper func
 * @function getDispatcher
 * @param {Object} config - Usage settings
 * @return {Object} Dispatcher
 * @memberof svg-dispatcher
 */
function getDispatcher(config) {
  return new Dispatcher(config);
}

module.exports.getDispatcher = getDispatcher;
