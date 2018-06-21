/**
 * SVG manipulations using gulp, largely inspired and modified from gulp-svg-sprites
 * https://github.com/shakyshane/gulp-svg-sprites#readme
 * @namespace (internal) gulp-svg-multitool
 */
const SpriteData = require("svg-sprite-data");
const through2 = require("through2");
const gutil = require("gulp-util");
const File = gutil.File;
const Q = require("q");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const gm = require("gm");
const im = gm.subClass({ imageMagick: true });
const PLUGIN_NAME = "gulp-svg-multitool";
/**
 * Stored RegExp patterns used for parsing svg file data
 * @constant {Object} PATTERNS
 * @property {RegExp} PATTERNS.tagInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgSymbolInner - RegExp pattern
 * @property {RegExp} PATTERNS.svgDefsInner - RegExp pattern
 * @property {RegExp} PATTERNS.elementTags - RegExp pattern
 * @property {RegExp} PATTERNS.innerMarkup - RegExp pattern
 * @property {RegExp} PATTERNS.findChildren - RegExp pattern
 * @property {RegExp} PATTERNS.findTopLevel - RegExp pattern
 * @property {RegExp} PATTERNS.parseTags - RegExp pattern
 * @property {RegExp} PATTERNS.parseAttributes - RegExp pattern
 * @property {RegExp} PATTERNS.classDef - RegExp pattern
 * @property {RegExp} PATTERNS.classDefName - RegExp pattern
 * @property {RegExp} PATTERNS.classAttrib - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlock - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlockInner - RegExp pattern
 * @property {RegExp} PATTERNS.nan - RegExp pattern
 * @memberof (internal) gulp-svg-multitool
 */
const PATTERNS = {
    tagInner: /<(\w+)\s?[^>]*>([\w\W]*)<\/\1>/g,
    svgInner: /(?:<svg[^>]*>)([\w\W]*)(?:<\/svg>)/g,
    svgSymbolInner: /(?:<symbol[^>]*>)([\w\W]*)(?:<\/symbol>)/g,
    svgDefsInner: /(?:<defs[^>]*>)([\w\W]*)(?:<\/defs>)/g,
    elementTags: /<(\/?\w+)/g,
    innerMarkup: /<(\w+)\s?([^>]*)>([\w\W]*)<\/\1>/g,
    findChildren: /<(\w+)([^>]*)>([\w\d\s\W\S]*?)(?=<\/\1>)/,
    findTopLevel: /<\w+\s?([^>]*)>([^<]*)<\/[^>]*>/g,
    parseTags: /(?:<(\w+)\s?([^>]*)>)([\w\s]*)/g,
    parseAttributes: /([\w\-]+)\=\"([\s\w\d\-\.\(\)\{\}\#\!]+)\"/,
    classDef: /([\.\#]?[\w\d\-]+)(?:[\{\s])/g,
    classDefName: /(?![\.\#\}\s])([\w\d\-]+)(?=[\{\s])/g,
    classAttrib: /(?:class=[\"\"])([^\"\"]+)(?:[\"\"])/g,
    styleBlock: /(<style>.+<\/style>)/g,
    styleBlockInner: /(?:<style>)(.+)(?:<\/style>)/g,
    nan: /(NaN(\s)?)+/g
};

const FindChildren = new RegExp(PATTERNS.innerMarkup, "g");

let STYLE_STRING = "";
let JSON_STRING = "";
let JSON_DATA = {};
/**
 * Default configuration. Everything here can be overridden
 * @constant {Object} options
 * @property {Boolean} options.symbols - Use symbol blocks instead of defs
 * @property {Boolean} options.jsonData - Generate JSON data from SVG files
 * @property {Boolean} options.pngFallback - Generate PNG fallback images of each SVG
 * @property {Boolean} options.asyncTransforms - Use async transforms
 * @property {String} options.outputPath - Define the output path for generated files.
 * @property {String} options.previewFile - Define the output path for generated files.
 * @property {String} options.jsonFile - Define the output path for generated files.
 * @property {String} options.svgOutputFile - Define the output path for generated files.
 * @property {Number} options.padding - Add padding to sprite items
 * @property {Number} options.baseSize - Set the base font-size for the icon element
 * @property {Function} options.transformData - Override the default data transforms
 * @property {Function} options.afterTransform - Apply additional data transforms AFTER the options
 * @memberof (internal) gulp-svg-multitool
 */
const options = {
    symbols: false,
    jsonData: true,
    preview: true,
    pngFallback: false,
    asyncTransforms: false,
    outputPath:   "./",
    previewFile: "preview.html",
    jsonFile: "svg-data.json",
    svgOutputFile: "atlas.svg",
    padding: 0,
    baseSize: 10,
    transformData: transformData,
    afterTransform: function(data, config, done) {
        if (config.asyncTransforms) {
           return done(data);
        }
        return data;
    }
};
/**
 * Apply camel case to a string
 * @function camelCase
 * @param input
 * @return {String}
 * @memberof (internal) gulp-svg-multitool
 */
function camelCase(input) {
  return input.replace(/\W+(.)/g, function(match, chr) {
      return chr.toUpperCase();
  });
}
/**
 * Use regex to find a childs contents and nested elements
 * @function jsonify
 * @param data
 * @return {Array}
 * @memberof (internal) gulp-svg-multitool
 */
function jsonify(data) {
  const jsonData = [];
  const FindChildren = new RegExp(PATTERNS.findChildren, "gim");
  let childArray;
  while ((childArray = FindChildren.exec(data)) !== null) {
    const tag = childArray[1];
    const props = {};
    const innerHTML = childArray[3];
    let children, context;
    if (childArray[2]) {
      const ParseAttributes = new RegExp(PATTERNS.parseAttributes, "g");
      while ((attrArray = ParseAttributes.exec(childArray[2])) !== null) {
        const attrib = camelCase(attrArray[1]);
        props[attrib] = attrArray[2];
      }
    }
    if (childArray[3]) {
      if (innerHTML.substring(0,1) === "<") {
        children = jsonify(innerHTML);
      } else {
        context = innerHTML;
      }
    }
    jsonData.push({ tag, props, context, children });
  }
  return jsonData;
}

/**
 * Parse for embedded style blocks within svgs
 * @function extractStyles
 * @param data
 * @param name
 * @param styleBlock
 * @return {String}
 * @memberof (internal) gulp-svg-multitool
 */
function extractStyles(data, name, styleBlock) {

  let output = data.replace(PATTERNS.styleBlock, "");
  let newStyleBlock = styleBlock;

  const baseClass = name.replace(/[^\w\d\-]/g, "");
  const defArray = styleBlock.match(PATTERNS.classDef);
  const classArray = styleBlock.match(PATTERNS.classDefName);

  if (defArray && classArray) {
    for (let i = 0; i < classArray.length; i += 1) {
      const srcDef = defArray[i];
      const orginal = classArray[i];
      const revised = `${baseClass}_${i}`;
      const searchable = `class="${orginal}"`;
      const replacement = `class="${revised}"`;
      output = output.replace(new RegExp(searchable, "g"), replacement);
      const newDef = srcDef.replace(orginal, revised);
      newStyleBlock = newStyleBlock.replace(srcDef, newDef);
    }
  }

  STYLE_STRING += newStyleBlock;
  output = output.replace(PATTERNS.nan, "-");
  output = output.replace(new RegExp("<defs></defs>", "g"), "");

  return output;
}

/**
 * Any last-minute data transformations before handing off to templates,
 * can be overridden by supplying a "transformData" option
 * @function transformData
 * @param data
 * @param config
 * @return {Object}
 * @memberof (internal) gulp-svg-multitool
 */
function transformData(data, config, done) {

  STYLE_STRING = "";
  JSON_DATA = {};

  const jsonPath = `${config.outputPath}/${config.jsonFile}`;

  data.baseSize = config.baseSize;
  data.svg = data.svg.map(function(item) {

      item.relHeight = item.height / config.baseSize;
      item.relWidth  = item.width / config.baseSize;

      item.relPositionX = item.positionX / config.baseSize - config.padding / config.baseSize;
      item.relPositionY = item.positionY / config.baseSize - config.padding / config.baseSize;
      item.normal = true;

      if (item.viewBox && item.viewBox.match(PATTERNS.nan)) {
        item.viewBox = item.viewBox.replace(PATTERNS.nan, "-");
      }

      const styleMatches = item.data.match(PATTERNS.styleBlockInner);
      if (styleMatches) {
        item.data = extractStyles(item.data, item.name, styleMatches[0]);
      }
      if (config.jsonData) {
        const jsonData = jsonify(item.data);
        JSON_DATA[item.name] = jsonData[0];
      }

      if (item.name.match(/~/g)) {
        return false;
      } else {
        item.name = item.selector[0].expression;
      }

      if (config.pngFallback) {
        const pngPath = `${config.outputPath}/${item.name}.png`;
        const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${item.data}</xml>`;
        const buffer = new Buffer(svgContent);
        gm(buffer, `${item.name}.svg`).write(pngPath, function (err) {
          if (err) {
            return handle(err);
          }
          console.log(`Created ${pngPath}`);
        });
      }

      return item;
  });

  data.svgStyle = STYLE_STRING;
  data.svg = data.svg.filter(function(item) { return item; });

  data.relWidth  = data.swidth / config.baseSize;
  data.relHeight = data.sheight / config.baseSize;

  if (config.jsonData) {
    const json = JSON.stringify(JSON_DATA);
    fs.writeFile(jsonPath, json, "utf8");
  }

  if (config.asyncTransforms) {
    return done(data);
  }
  return data;
}

/**
 * Helper for correct plugin errors
 * @function error
 * @param context
 * @param msg
 * @memberof (internal) gulp-svg-multitool
 */
function error(context, msg) {
  context.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
}

/**
 * @function writeFiles
 * @param stream
 * @param config
 * @param svg
 * @param data
 * @param cb
 * @memberof (internal) gulp-svg-multitool
 */
function writeFiles(stream, config, svg, data, cb) {

  data.config = config;

  var promises = [];
  var template = "";
  var previewTemplate = "";

  if (!config.svgOutputFile) {
      cb(null);
  }
  if (config.symbols) {
      template = fs.readFileSync(__dirname + "/templates/symbols.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-symbols.html", "utf-8");
  } else {
      template = fs.readFileSync(__dirname + "/templates/defs.svg", "utf-8");
      previewTemplate = fs.readFileSync(__dirname + "/templates/preview-defs.html", "utf-8");
  }
  makeFile(template, config.svgOutputFile, stream, data).then(function(output) {
      data.svgInline = output;
      if (config.preview) {
          promises.push(makeFile(previewTemplate, config.previewFile, stream, data));
      }
      Q.all(promises).then(cb);
  });
}

/**
 * @function makeFile
 * @param template
 * @param fileName
 * @param stream
 * @param data
 * @return {Promise.promise|*}
 * @memberof (internal) gulp-svg-multitool
 */
function makeFile(template, fileName, stream, data) {

  var deferred = Q.defer();
  var id = _.uniqueId();
  var out = "";

  try {
    var compiled = _.template(template);
    out = compiled(data);
  }catch (e) {
    deferred.reject(e);
    return deferred.promise;
  }

  stream.push(new File({
      cwd:  "./",
      base: "./",
      path: fileName,
      contents: new Buffer(out)
    }));

  deferred.resolve(out);

  return deferred.promise;
}

/**
 * SVG manipulations using gulp, largely inspired and modified from gulp-svg-sprites
 * https://github.com/shakyshane/gulp-svg-sprites#readme
 * @module gulp-svg-multitool
 */

/** Compile SVGs. */
module.exports = function(config) {

    config = _.merge(_.cloneDeep(options), config || {});

    var spriter = new SpriteData(config);

    return through2.obj(function(file, enc, cb) {

        spriter.add(file.path, file.contents.toString());

        cb(null);

      }, function(cb) {

        var stream = this;

        spriter.compile(config, function(err, svg) {
            var onDoneAfterTransformData = function(data) {
                writeFiles(stream, config, svg.svg, data, cb.bind(null, null));
              };

            var onDoneTransformData = function(data) {
                config.afterTransform(data, config, onDoneAfterTransformData);
              };

            if (config.asyncTransforms) {
              config.transformData(svg.data, config, onDoneTransformData);
            } else {
              var data = config.transformData(svg.data, config);
              data = config.afterTransform(data, config);
              writeFiles(stream, config, svg.svg, data, cb.bind(null, null));
            }
        });
    });
};
