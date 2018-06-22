var File = require("vinyl");
var assert = require("chai").assert;
var vfs = require("vinyl-fs");
var through = require("through2");
var svgMultitool = require("../../index");

/**
 * @module TestUtility
 */
function TestUtility() {
    this.actual = {};
    this.src = vfs.src;
    this.dest = vfs.dest;
}

TestUtility.prototype.injectTestPipe = function(callback) {

  const self = this;

  // console.log("Testing Pipe INITIALIZED");

  return through.obj(function(file, enc, cb) {
    if (typeof file === "string") {
        self.actual[file] = null;
    } else {
        // console.log("Testing Pipe onData FIRED");
        // console.log(file);
        self.actual[file.path] = file.contents.toString();
    }

    this.push(file);

    cb(null);
  }, function() {
    callback(self.actual);
  });
};

/**
 * @function streamHelper
 * @param {Stream} stream
 * @param {Function} cb
 */
TestUtility.prototype.streamHelper = function(config, cb) {
    const self = this;
    // console.log("Stream Helper INITIALIZED");
    self.src("../fixtures/**")
        .pipe(svgMultitool(config))
        .pipe(self.injectTestPipe(cb))
        .pipe(self.dest(config.outputPath));
};

/**
 * @function streamTester
 * @param {Object} config
 * @param {Function} done
 */
TestUtility.prototype.streamTester = function(config, done, expected = []) {
    // console.log("Test Stream INITIALIZED");
    this.streamHelper(config, function (data) {
        // console.log("Test Stream callback FIRED");
        assert.deepEqual(Object.keys(data), expected);
        done();
    });
    // done();
};


module.exports.TestUtility = new TestUtility();
