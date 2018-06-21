var fs = require("vinyl-fs");
var svgMultitool = require("./index");

var paths = {
  svgSrc: ["test/fixtures/basic/*.svg"],
  svgDest: "./test/output"
};

console.info("Generating SVG conversions using " + paths.svgSrc);

fs.src("test/fixtures/basic/*.svg")
    .pipe(svgMultitool())
    .pipe(fs.dest(paths.svgDest));

console.info("Generated files have been saved to " + paths.svgDest);
