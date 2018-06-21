"use strict";

var streamTester = require("./init").streamTester;

describe("Sending Files", function () {

    it("SYMBOLS", function (done) {

        var config = {
            symbols: true,
            outputPath: "./test/output",
            svgOutputFile: "symbols.svg"
        };

        streamTester(config, done);
    });
});
