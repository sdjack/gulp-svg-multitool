/**
 * Custom Console
 * @namespace svg-console
 */
const colors = require("colors/safe");

/**
 * getTimestamp
 * @function getTimestamp
 * @return {String} timestamp
 * @memberof svg-console
 */
function getTimestamp() {
  const date = new Date();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return "[" +
         colors.gray(((hour < 10) ? "0" + hour : hour) +
         ":" +
         ((minutes < 10) ? "0" + minutes : minutes) +
         ":" +
         ((seconds < 10) ? "0" + seconds : seconds)) +
         "] ";
}

/**
 * Custom Console
 * @function ConSolo
 * @param {String} name - The logged parent source
 * @memberof svg-console
 */
function ConSolo(name) {
  this.title = name;
}

/**
 * Custom Console
 * @function ConSolo
 * @param {*} msgs - All logged args
 * @memberof svg-console
 */
ConSolo.prototype.log = function(msg) {
  const self = this;
  console.log(getTimestamp() + self.title + ":", colors.cyan(msg));
}

/**
 * Misc helper func
 * @function getConSolo
 * @param {String} name - The logged parent source
 * @return {Object} ConSolo
 * @memberof svg-console
 */
function getConSolo(name) {

  return new ConSolo(name);
}

module.exports.getConSolo = getConSolo;
