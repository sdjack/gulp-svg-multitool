var gulp = require("gulp");
var svgMultitool = require("../index"); // replace with gulp-svg-multitool in your project
/**
 * Example Method shows basic usage with no options/config
 * @method gulp-defs
 */
gulp.task("multitool:defs", ["clean:output"], function() {
    return gulp.src("test/fixtures/basic/*.svg")
        .pipe(svgMultitool())
        .pipe(gulp.dest("./test/output"));
  });
