var gulp = require("gulp");
var eslint = require("gulp-eslint");
var contribs = require("gulp-contribs");
var del = require("del");
var svgMultitool = require("./index.js");

gulp.task("clean", function() {
  return del(["test/output/**/*"]);
});

gulp.task("generate", function() {
  return gulp.src(["test/fixtures/**/*"])
    .pipe(svgMultitool({
        symbols: false,
        pngFallback: true,
        atlasFile: "defs.svg"
    }))
    .pipe(gulp.dest("test/output"));
});

gulp.task("runtest", function() {
  return gulp.src(["test/specs/**/*.js", "index.js"])
    .pipe(eslint("test/specs/.eslintrc"))
    .pipe(eslint.format());
});

gulp.task("lint", gulp.series("clean", "generate", "runtest"));

gulp.task("contribs", function() {
  gulp.src("README.md")
    .pipe(contribs())
    .pipe(gulp.dest("./"));
});

require("./examples/gulpfile.defs");
require("./examples/gulpfile.symbols");
require("./examples/gulpfile.pngs");
require("./examples/gulpfile.options");

gulp.task("default", gulp.series("clean", "generate", "runtest"));
