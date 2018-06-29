"use strict";

var getTestUtility = require("./init.spec").getTestUtility;

describe("Sending Test Files", function() {
  var TestUtility = getTestUtility();

  it("Compiling SVGs as DEFS", function(done) {
    var config = {
      symbols: false,
      preview: true,
      // pngFallback: true,
      atlasFile: "defs.svg"
    };

    TestUtility.streamTester(config, ["svg-data.json", "defs.svg", "preview.html"], done);
  });
});
