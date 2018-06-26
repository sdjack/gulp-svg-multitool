/**
 * SVG manipulations using gulp, largely inspired and modified from gulp-svg-sprites
 * https://github.com/shakyshane/gulp-svg-sprites#readme
 * @namespace SvgData
 */
/**
 * Stored RegExp patterns used for parsing svg file data
 * @constant {Object} PATTERNS
 * @property {RegExp} PATTERNS.nan - RegExp pattern
 * @property {RegExp} PATTERNS.comments - RegExp pattern
 * @property {RegExp} PATTERNS.innerMarkup - RegExp pattern
 * @property {RegExp} PATTERNS.parseAttributes - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlock - RegExp pattern
 * @property {RegExp} PATTERNS.styleBlockInner - RegExp pattern
 * @property {RegExp} PATTERNS.styleDef - RegExp pattern
 * @property {RegExp} PATTERNS.styleProps - RegExp pattern
 * @property {RegExp} PATTERNS.styleElements - RegExp pattern
 * @property {RegExp} PATTERNS.styleIDs - RegExp pattern
 * @property {RegExp} PATTERNS.styleClasses - RegExp pattern
 * @memberof (internal) gulp-svg-multitool
 */
const PATTERNS = {
    nan: /(NaN(\s)?)+/g,
    comments: /<!--[\s\S]*?-->/g,
    innerMarkup: /<(\w+)([^>]*)>([\w\d\s\W\S]*?)(?=<\/\1>)/,
    parseAttributes: /([\w\-]+)\=\"([\s\w\d\-\.\(\)\{\}\#\!]+)\"/,
    styleBlock: /(?=<style[^>]*>)([\w\W]*<\/style>)/g,
    styleBlockInner: /(?:<style[^>]*>)([\w\W]*)(?:<\/style>)/g,
    styleDef: /[\.\#]?([\w\d\-]+){(.+?)}/g,
    styleProps: /([\w\d\-]+)\:([\w\d\s\.\#\,\-]+)(?=[},;]|$)/,
    styleElements: /[^\.\#]([\w\d\-]+){(.+?)}/,
    styleIDs: /\#([\w\d\-]+){(.+?)}/,
    styleClasses: /\.([\w\d\-]+){(.+?)}/
};
/**
 * Apply camel case to a string
 * @function camelCase
 * @param input
 * @return {String}
 */
function camelCase(input) {
  return input.replace(/\W+(.)/g, function(match, chr) {
      return chr.toUpperCase();
  });
}

/**
 * @module SvgData
 */
function SvgData(id, contents) {

    let elements = {};
    let ids = {};
    let classes = {};
    let svg = contents.replace(PATTERNS.comments, '');

    const styleMatches = svg.match(PATTERNS.styleBlockInner);

    if (styleMatches) {
      const styles = styleMatches[0];
      elements = this.getStyleData(styles, PATTERNS.styleElements);
      ids = this.getStyleData(styles, PATTERNS.styleIDs);
      classes = this.getStyleData(styles, PATTERNS.styleClasses);
    }

    svg = svg.replace(PATTERNS.styleBlock, "");
    svg = svg.replace(PATTERNS.nan, "-");
    svg = svg.replace(new RegExp("<defs></defs>", "g"), "");
    this.name = id;
    this.data = svg;
    this.styles = { elements, ids, classes };
    this.props = this.getPropData(svg, PATTERNS.innerMarkup);
}
/**
 * Parse string CSS to object data
 * @function getStyleData
 * @param {String} input - String to be parsed
 * @param {RegExp} pattern - pattern to use
 * @return {Object}
 */
SvgData.prototype.getStyleData = function(input, pattern) {
  const output = {};
  const def = new RegExp(pattern, "g");
  while ((defArray = CSSElements.exec(styles)) !== null) {
    const tag = defArray[1];
    const props = {};
    if (defArray[2]) {
      const parse = new RegExp(PATTERNS.styleProps, "g");
      while ((propArray = parse.exec(defArray[2])) !== null) {
        props[propArray[1]] = propArray[2];
      }
    }
    output[tag] = props;
  }
  return output;
}
/**
 * Use regex to find a childs contents and nested elements
 * @function getPropData
 * @param {String} input - String to be parsed
 * @param {RegExp} pattern - pattern to use
 * @return {Array}
 */
SvgData.prototype.getPropData = function(input, pattern) {
  const output = [];
  const markup = new RegExp(pattern, "gim");
  let markupArray;
  while ((markupArray = markup.exec(input)) !== null) {
    const tag = markupArray[1];
    const props = {};
    const innerHTML = markupArray[3];
    let children, context;
    if (markupArray[2]) {
      const parse = new RegExp(PATTERNS.parseAttributes, "g");
      while ((attrArray = parse.exec(markupArray[2])) !== null) {
        const attrib = camelCase(attrArray[1]);
        props[attrib] = attrArray[2];
      }
    }
    if (markupArray[3]) {
      if (innerHTML.substring(0,1) === "<") {
        children = this.getPropData(innerHTML, pattern);
      } else {
        context = innerHTML;
      }
    }
    output.push({ tag, props, context, children });
  }
  return output;
}

/**
 * @function getSvgData
 * @param {String} svg
 * @return {Object} SvgData
 */
function getSvgData(id, svg) {

  return new SvgData(id, svg);
}

module.exports.getSvgData = getSvgData;
