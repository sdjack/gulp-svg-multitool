/**
 * SVG Object
 * @namespace (internal) svg-object
 */
const _ = require("lodash");
const path = require("path");
const SVGO = require("svgo");
const getSvgData = require("./svg-data").getSvgData;

const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} defaultConfig
 * @memberof (internal) svg-object
 */
const defaultConfig = {
  plugins: [{
      cleanupAttrs: true,
    }, {
      removeDoctype: true,
    },{
      removeXMLProcInst: true,
    },{
      removeComments: true,
    },{
      removeMetadata: true,
    },{
      removeTitle: true,
    },{
      removeDesc: true,
    },{
      removeUselessDefs: true,
    },{
      removeEditorsNSData: true,
    },{
      removeEmptyAttrs: true,
    },{
      removeHiddenElems: true,
    },{
      removeEmptyText: true,
    },{
      removeEmptyContainers: true,
    },{
      removeViewBox: false,
    },{
      cleanupEnableBackground: true,
    },{
      convertStyleToAttrs: true,
    },{
      convertColors: true,
    },{
      convertPathData: true,
    },{
      convertTransform: true,
    },{
      removeUnknownsAndDefaults: true,
    },{
      removeNonInheritableGroupAttrs: true,
    },{
      removeUselessStrokeAndFill: true,
    },{
      removeUnusedNS: true,
    },{
      cleanupIDs: true,
    },{
      cleanupNumericValues: true,
    },{
      moveElemsAttrsToGroup: true,
    },{
      moveGroupAttrsToElems: true,
    },{
      collapseGroups: true,
    },{
      removeRasterImages: false,
    },{
      mergePaths: true,
    },{
      convertShapeToPath: true,
    },{
      sortAttrs: true,
    },{
      removeDimensions: true,
    },{
      removeAttrs: {attrs: '(stroke|fill)'},
    }]
};
/**
 * @module SvgObject
 */
function SvgObject(file, config) {

    this._settings = _.extend(defaultConfig, config || {});
    this._path = file.path;
    this._contents = file.contents.toString();
    this._preprocessor = new SVGO(this._settings);

    this.id = path.basename(file.path, path.extname(file.path));
}

/**
 * Request the processed svg file data
 *
 */
SvgObject.prototype.compile = function (callback) {

    const self = this;

    try {

        self._preprocessor.optimize(self._contents, function (result) {

            const svgData = getSvgData(self.id, result.data);
            process.nextTick(function() { callback(null, svgData); });
        });
    } catch (error) {

        callback(error, null);
    }
};

/**
 * @function getSvgObject
 * @param {File} file - The SVG source file
 * @param {Object} config - Usage settings
 * @return {Object} SvgObject
 */
function getSvgObject(file, config) {

  return new SvgObject(file, config);
}

module.exports.getSvgObject = getSvgObject;
