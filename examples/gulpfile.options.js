var gulp = require("gulp");
var svgMultitool = require("../index"); // replace with gulp-svg-multitool in your project

var config = {
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
 * Example Method shows some of the different options
 * that can be used
 * @method gulp-options
 */
gulp.task("multitool:options", function() {
  return gulp.src("test/fixtures/*.svg")
     .pipe(svgMultitool(config))
     .pipe(gulp.dest("test/output"));
});
gulp.task("options", gulp.series("clean", "multitool:options"));
