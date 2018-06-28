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
     * @property atlasPath
     * @type String
     */
    atlasPath: './icons',
    /**
     * Change the svg output filename
     * @property atlasFile
     * @type String
     */
    atlasFile: 'generated.svg'
};
/**
 * Example Method shows how to utilize symbols mode
 * @method gulp-symbols
 */
gulp.task("multitool:symbols", function() {
  return gulp.src("test/fixtures/*.svg")
     .pipe(svgMultitool(config))
     .pipe(gulp.dest("test/output"));
});
gulp.task("symbols", gulp.series("clean", "multitool:symbols"));
