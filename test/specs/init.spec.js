/**
 * Unit testing spec
 * @namespace init.spec
 */
var File = require("vinyl");
var assert = require("chai").assert;
var vfs = require("vinyl-fs");
var through = require("through2");
var svgMultitool = require("../../index");

/**
 * Unit testing construct
 * @function TestUtility
 * @memberof init.spec
 */
function TestUtility() {
  this.actual = {};
  this.src = vfs.src;
  this.dest = vfs.dest;
}

/**
 * Misc helper
 * @function injectTestPipe
 * @param {Function} callback - callback
 * @return {Stream}
 * @memberof init.spec
 */
TestUtility.prototype.injectTestPipe = function(callback) {
  var self = this;

  // console.log("Testing Pipe INITIALIZED");

  return through.obj(
    function(file, enc, cb) {
      if (typeof file === "string") {
        self.actual[file] = null;
      } else {
        // console.log("Testing Pipe onData FIRED");
        // console.log(file);
        self.actual[file.path] = file.contents.toString();
      }

      this.push(file);

      cb(null);
    },
    function() {
      callback(self.actual);
    }
  );
};

/**
 * Misc helper
 * @function streamHelper
 * @param {Object} config
 * @param {Function} cb
 * @memberof init.spec
 */
TestUtility.prototype.streamHelper = function(config, cb) {
  var self = this;
  // console.log("Stream Helper INITIALIZED");
  self
    .src(["test/fixtures/**/*"])
    .pipe(svgMultitool(config))
    .pipe(self.injectTestPipe(cb))
    .pipe(self.dest("test/output"));
};

/**
 * @function streamTester
 * @param {Object} config
 * @param {Function} done
 * @memberof init.spec
 */
TestUtility.prototype.streamTester = function(config, expected, done) {
  // console.log("Test Stream INITIALIZED");
  this.streamHelper(config, function(data) {
    // console.log("Test Stream callback FIRED");
    assert.deepEqual(Object.keys(data), expected);
    done();
  });
  // done();
};

/**
 * Instance creator
 * @function getTestUtility
 * @return {Object} TestUtility
 * @memberof init.spec
 */
function getTestUtility() {
  return new TestUtility();
}

module.exports.getTestUtility = getTestUtility;
