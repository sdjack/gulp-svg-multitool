var gulp = require("gulp");
var svgMultitool = require("../index"); // replace with gulp-svg-multitool in your project

var config = {
    /**
     * Indicate that png fallbacks should be generated
     * @property outputPath
     * @type Boolean
     */
    pngFallback: true,
    /**
     * Change the output directory
     * @property outputPath
     * @type String
     */
    outputPath: './icons'
};
/**
 * Example Method shows how to utilize png fallbacks
 * @method gulp-pngs
 */
gulp.task("multitool:pngs", ["clean:output"], function () {
    gulp.src("test/fixtures/defs/*.svg")
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("./test/output"))
});
