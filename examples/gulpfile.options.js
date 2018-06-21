var gulp = require("gulp");
var svgMultitool = require("../index"); // replace with gulp-svg-multitool in your project

var config = {
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
 * Example Method shows some of the different options
 * that can be used
 * @method gulp-options
 */
gulp.task("multitool:options", ["clean:output"], function () {
    gulp.src("test/fixtures/basic/*.svg")
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("./test/output"))
});
