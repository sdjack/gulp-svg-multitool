"use strict";

const TestUtility = require("./init.spec").TestUtility;

describe("Sending Test Files", function () {

    it("Compiling SVGs as DEFS", function (done) {

        var config = {
            symbols: false,
            pngFallback: true,
            outputPath: "./test/output",
            svgOutputFile: "defs.svg"
        };

        TestUtility.streamTester(config, done, [ "defs.svg", "preview.html" ]);
    });

    it("Compiling SVGs as SYMBOLS", function (done) {

        var config = {
            symbols: true,
            pngFallback: true,
            outputPath: "./test/output",
            svgOutputFile: "symbols.svg"
        };

        TestUtility.streamTester(config, done, [ "defs.svg", "preview.html", "symbols.svg" ]);
    });
});
