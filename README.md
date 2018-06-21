gulp-svg-multitool [![Build Status](https://travis-ci.org/sdjack/gulp-svg-multitool.svg?branch=master)](https://travis-ci.org/sdjack/gulp-svg-multitool)
================

## Table of contents

* [Install](#install)
* [Usage](#usage)
* [PNG fallbacks](#png-fallback)
* [Symbols mode](#symbols-mode)
* [Defs mode](#defs-mode)
   * [Custom filenames](#custom-filenames)
   * [Base size](#base-size)
   * [No previews](#no-previews)
* [Advanced: data transforms](#advanced-data-transforms)
* [License](#license)

## Install
Install it locally to your project.

```js
$ npm install --save-dev gulp-svg-multitool
```

## Usage
With no configuration, `gulp-svg-multitool` will create the following files:

1. `svg/atlas.svg` - Sprite Sheet containing all of your SVGs
1. `preview.html`    - A preview page with instructions & snippets

```js
var svgMultitool = require("gulp-svg-multitool");

gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool())
        .pipe(gulp.dest("assets"));
});
```

Then, if you had a `facebook.svg` file, you'd be able to use the following markup in your webpage:

```html
<i class="icon facebook"></i>
```

## PNG fallbacks
You can easily generate png files from your source svgs.

```js
var svgMultitool = require("gulp-svg-multitool");

gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({pngFallback: true}))
        .pipe(gulp.dest("assets"));
});
```

## Symbols mode
To get output SVG data as this [CSS Tricks article](http://css-tricks.com/svg-symbol-good-choice-icons/) outlines.

```js
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({symbols: true}))
        .pipe(gulp.dest("assets"));
});
```

### Custom filenames
You can also change the generated filenames with ease. For example, if you want to create a `scss` partial instead, you could just do:

```js

// Custom SVG filename
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({
            svgOutputFile: "svg.svg"
        }))
        .pipe(gulp.dest("assets"));
});

// Custom preview filename + custom SVG filename
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({
            svgOutputFile: "svg.svg",
            previewFile: "index.html"
        }))
        .pipe(gulp.dest("assets"));
});

// Custom JSON filename
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({
            jsonFile: "output.json"
        }))
        .pipe(gulp.dest("assets"));
});
```

### Base size
Set the font-size of the .icon class. Just pass a plain number, no units.

```js
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({
            baseSize: 16
        }))
        .pipe(gulp.dest("assets"));
});
```

### No previews
If you don't want 'em. Works in all modes.

```js
gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool({
            preview: false
        }))
        .pipe(gulp.dest("assets"));
});
```

## Advanced: data transforms
If you want to do some custom stuff with your templates, you might need to transform the SVG data before it gets to your template. There
are two functions you can provide to do this and they'll override the internal ones. Override `transformData` and you'll have direct access
to the data returned from [svg-sprite-data](https://github.com/shakyShane/svg-sprite-data). This will skip the few transformations that
this library applies - so use with caution. (If you want to modify the data as well after our internal modifications, use `afterTransform` instead.)

```js

// Synchronous
var config = {
    transformData: function (data, config) {
        return data; // modify the data and return it
    },
    svgOutputFile: "svg.svg"
};

// Asynchronous
var config = {
    asyncTransforms: true,
    transformData: function (data, config, done) {
        done(data); // modify the data and pass it
    },
    svgOutputFile: "svg.svg"
};

gulp.task('multitool', function () {
    return gulp.src('assets/svg/*.svg')
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("assets"));
});

```

## License
Copyright (c) 2018 Steven Jackson

Licensed under the MIT license.
