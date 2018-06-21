var gulp = require("gulp");
var svgMultitool = require("../index"); // replace with gulp-svg-multitool in your project

var config = {
    /**
     * Indicate symbols mode
     * @property symbols
     * @type Boolean
     */
    symbols: true,
    /**
     * Change the output directory
     * @property outputPath
     * @type String
     */
    outputPath: './icons',
    /**
     * Change the svg output filename
     * @property outputFile
     * @type String
     */
    outputFile: 'generated.svg'
};
/**
 * Example Method shows how to utilize symbols mode
 * @method gulp-symbols
 */
gulp.task("multitool:symbols", ["clean:output"], function() {
    return gulp.src("test/fixtures/basic/*.svg")
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("./test/output"));
  });
