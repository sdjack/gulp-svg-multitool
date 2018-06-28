gulp-svg-multitool [![Build Status](https://travis-ci.org/sdjack/gulp-svg-multitool.svg?branch=master)](https://travis-ci.org/sdjack/gulp-svg-multitool)
================

## Table of contents

* [Install](#install)
* [Usage](#usage)
* [Examples](#examples)
   * [PNG fallbacks](#png-fallback)
   * [Symbols mode](#symbols-mode)
   * [Custom filenames](#custom-filenames)
   * [Previews](#previews)
* [Post Processing](#post-processing)
* [Options](#options)
* [License](#license)

## Install
Install it locally to your project.

```js
$ npm install --save-dev gulp-svg-multitool
```

## Usage

```js
var svgMultitool = require("gulp-svg-multitool");

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool())
        .pipe(gulp.dest("out"));
});
```
This will generate the following output files:

1. `svg-atlas.svg` - Single optimized SVG containing all of your source SVGs
2. `svg-data.json` - SVG data arranged in JSON format

## Examples

#### PNG fallbacks
You can easily generate png files from your source svgs.

```js
var config = {
  pngFallback: true
};

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("out"));
});
```

#### Symbols mode
To get output SVG data as this [CSS Tricks article](http://css-tricks.com/svg-symbol-good-choice-icons/) outlines.

```js
var config = {
  symbols: true
};

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("out"));
});
```

#### Custom filenames
You can also change the generated filenames.

```js
var config = {
  atlasFile: "output.svg",        /* SVG filename */
  previewFile: "output.html",     /* Preview filename */
  jsonFile: "output.json"         /* JSON filename */
};

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("out"));
});
```

#### Previews
An HTML preview page can be generated to show the output results and possible usage.

```js
var config = {
  preview: false
};

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool({
            preview: false
        }))
        .pipe(gulp.dest("out"));
});
```

## Post Processing
If you want to make last minute changes to the generated SVG data before it gets to the output templates,
you can use one of the following options.

```js
var config = {
    postProcess: function (data, config) {
        return data; // modify the data and return it
    }
};

/* or */

var config = {
    async: true, // asynchronous
    postProcess: function (data, config, done) {
        done(data); // modify the data and pass it
    }
};

/* then */

gulp.task('multitool', function () {
    return gulp.src('*.svg')
        .pipe(svgMultitool(config))
        .pipe(gulp.dest("out"));
});

```

## Options
<table>
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>

<tr>
    <td><b>async</b></td>
    <td>Boolean</td>
    <td><code>false</code></td>
    <td><p>Indicate whether or not the processing and post processing should be executed asynchronously</p></td>
</tr>

<tr>
    <td><b>symbols</b></td>
    <td>Boolean</td>
    <td><code>false</code></td>
    <td><p>Indicate whether the SVG output file should use &lt;symbol&gt; elements instead of a single &lt;defs&gt; element.</p></td>
</tr>

<tr>
    <td><b>jsonData</b></td>
    <td>Boolean</td>
    <td><code>true</code></td>
    <td><p>Indicate whether or not a JSON data file should be created</p></td>
</tr>

<tr>
    <td><b>preview</b></td>
    <td>Boolean</td>
    <td><code>false</code></td>
    <td><p>Indicate whether or not an HTML preview file should be created</p></td>
</tr>

<tr>
    <td><b>pngFallback</b></td>
    <td>Boolean</td>
    <td><code>false</code></td>
    <td><p>Indicate whether or not PNGs should be generated from the source files</p></td>
</tr>

<tr>
    <td><b>pngPath</b></td>
    <td>String</td>
    <td><code>./</code></td>
    <td><p>Define the png output file path</p></td>
</tr>

<tr>
    <td><b>atlasFile</b></td>
    <td>String</td>
    <td><code>&quot;svg-atlas.svg&quot;</code></td>
    <td><p>Define the atlas output file name</p></td>
</tr>

<tr>
    <td><b>atlasPath</b></td>
    <td>String</td>
    <td><code>./</code></td>
    <td><p>Define the atlas output file path</p></td>
</tr>

<tr>
    <td><b>jsonFile</b></td>
    <td>String</td>
    <td><code>&quot;svg-data.json&quot;</code></td>
    <td><p>Define the JSON output file name</p></td>
</tr>

<tr>
    <td><b>jsonPath</b></td>
    <td>String</td>
    <td><code>./</code></td>
    <td><p>Define the JSON output file path</p></td>
</tr>

<tr>
    <td><b>previewFile</b></td>
    <td>String</td>
    <td><code>&quot;preview.html&quot;</code></td>
    <td><p>Define the preview output file name</p></td>
</tr>

<tr>
    <td><b>previewPath</b></td>
    <td>String</td>
    <td><code>./</code></td>
    <td><p>Define the preview output file path</p></td>
</tr>

<tr>
    <td><b>postProcess</b></td>
    <td>Function</td>
    <td><code>postProcess</code></td>
    <td><p>Define the preview output file path</p></td>
</tr>

<tr>
    <td><b>svgoConfig</b></td>
    <td>Object</td>
    <td>
      <a href="https://github.com/svg/svgo/blob/master/README.md"><strong>README</strong></a>
    </td>
    <td><p>Subset of options for the <a href="https://www.npmjs.com/package/svgo"><strong>svgo</strong></a> plugin.</p></td>
</tr>

</tbody>
</table>

## License
Copyright (c) 2018 Steven Jackson

Licensed under the MIT license.
