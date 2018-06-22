var gulp = require("gulp");
var jshint = require("gulp-jshint");
var contribs = require("gulp-contribs");
var clean = require("gulp-clean");
var svgMultitool = require("./index.js");

gulp.task("clean:output", function() {
  return gulp.src("test/output", {read: false})
    .pipe(clean());
});

require("./examples/gulpfile.defs");
require("./examples/gulpfile.symbols");
require("./examples/gulpfile.pngs");
require("./examples/gulpfile.options");

gulp.task("lint", function() {
  gulp.src(["test/specs/**/*.js", "index.js"])
    .pipe(jshint("test/specs/.jshintrc"))
    .pipe(jshint.reporter("default"))
    .pipe(jshint.reporter("fail"));
});

gulp.task("contribs", function() {
  gulp.src("README.md")
    .pipe(contribs())
    .pipe(gulp.dest("./"));
});

gulp.task("ensure", function() {
  gulp.src(["./test/fixtures/gulp.svg"])
    .pipe(svgMultitool({
        symbols: false,
        pngFallback: true,
        outputPath: "./test/output",
        svgOutputFile: "defs.svg"
    }))
    .pipe(gulp.dest("./test/output"));
});

gulp.task("default", ["lint"]);
