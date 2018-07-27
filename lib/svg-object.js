/**
 * SVG Object
 * @namespace svg-object
 */
const _ = require("lodash");
const path = require("path");
const SVGO = require("svgo");
const getSvgData = require("./svg-data").getSvgData;

const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * SVG Object
 * @function SvgObject
 * @param {File} file - The SVG source file
 * @param {Object} config - Usage settings
 * @memberof svg-object
 */
function SvgObject(file, config) {
  this._settings = _.extend({}, config);
  this._path = file.path;
  this._contents = file.contents.toString();
  this._preprocessor = new SVGO(this._settings);

  this.id = path.basename(file.path, path.extname(file.path));
}

/**
 * Request the processed svg file data
 * @function compile
 * @param {Function} callback - Post compile callback
 * @memberof svg-object
 */
SvgObject.prototype.compile = function(callback) {
  const self = this;

  try {
    self._preprocessor.optimize(self._contents, function(result) {
      const svgData = getSvgData(self.id, result.data);
      process.nextTick(function() {
        callback(null, svgData);
      });
    });
  } catch (error) {
    callback(error, null);
  }
};

/**
 * Misc helper func
 * @function getSvgObject
 * @param {File} file - The SVG source file
 * @param {Object} config - Usage settings
 * @return {Object} SvgObject
 * @memberof svg-object
 */
function getSvgObject(file, config) {
  return new SvgObject(file, config);
}

module.exports.getSvgObject = getSvgObject;
