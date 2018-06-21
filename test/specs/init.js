"use strict";

var File = require("vinyl");
var svgMultitool = require("../../index");
/**
 * @method streamHelper
 * @param {Stream} stream
 * @param {Function} cb
 */
function streamHelper(stream, cb) {

    stream.on("end", function () {
        cb();
    });
    // Write 2 files to the stream
    stream.write(new File({
        cwd:  "test/fixtures",
        base: "./",
        path: "unicorn.svg",
        contents: new Buffer("<svg version='1.1' baseProfile='full' width='300' height='200' xmlns='http://www.w3.org/2000/svg'><g></g></svg>")
    }));
    stream.write(new File({
        cwd:  "test/fixtures",
        base: "./",
        path: "facebook.svg",
        contents: new Buffer("<svg version='1.1' baseProfile='full' width='100' height='70' xmlns='http://www.w3.org/2000/svg'><g></g></svg>")
    }));
    // End the stream to allow tests to start
    stream.end();
}

/**
 * @method streamTester
 * @param config
 * @param done
 */
module.exports.streamTester = function (config, done) {
    svgMultitool(config);
    done();
};
