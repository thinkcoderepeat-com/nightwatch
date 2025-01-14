const ProtocolAction = require('../_base-action.js');

/**
 * Set the position of the current window - move the window to the chosen position.
 *
 * @example
 * module.exports = {
 *   'set current window position': function (browser) {
 *      // Move the window to the top left of the primary monitor
 *      browser.window.setPosition(0, 0, function (result) {
 *        console.log('window moved successfully');
 *      });
 *   },
 *
 *   'set current window position using ES6 async/await': async function (browser) {
 *      // Move the window to the top left of the primary monitor
 *      await browser.window.setPosition(0, 0);
 *   }
 * }
 *
 * @syntax .window.setPosition(x, y, [callback])
 * @method window.setPosition
 * @param {number} x New x-coordinate of the top-left corner of the window.
 * @param {number} y New y-coordinate of the top-left corner of the window.
 * @param {function} [callback] Optional callback function to be called when the command finishes.
 * @see window.setSize
 * @see window.setRect
 * @api protocol.window
 */
module.exports = class Session extends ProtocolAction {
  command(x, y, callback) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Coordinates passed to .window.getPosition() must be of type number.');
    }

    return this.transportActions.setWindowPosition(x, y, callback);
  }
};
