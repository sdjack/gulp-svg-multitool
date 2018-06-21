"use strict";

var streamTester = require("./init").streamTester;

describe("Sending Files", function () {

    it("DEFS", function (done) {

        var config = {
            symbols: false,
            outputPath: "./test/output",
            svgOutputFile: "defs.svg"
        };

        streamTester(config, done);
    });
});
