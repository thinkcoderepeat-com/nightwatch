const {until} = require('selenium-webdriver');

const {Logger, createPromise} = require('../../utils');
const {ScopedElementLocator} = require('./element-locator.js');

class ScopedElements {
  constructor(selector, parentScopedElement, nightwatchInstance) {
    this.parentScopedElement = parentScopedElement;
    this.nightwatchInstance = nightwatchInstance;

    // eslint-disable-next-line no-async-promise-executor
    this.webElements = new Promise(async (resolve, reject) => {
      if (selector instanceof Promise) {
        try {
          selector = await selector;
        } catch (error) {
          return reject(error);
        }
      }
      if (Array.isArray(selector)) {
        resolve(selector);
      } else {
        try {
          const webElements = await this.findElements(selector);

          resolve(webElements);
        } catch (error) {
          resolve([]);
        }
      }
    });
  }

  async findElements(descriptor) {
    const {
      timeout,
      condition,
      retryInterval,
      abortOnFailure,
      suppressNotFoundErrors
    } = ScopedElementLocator.create(descriptor, this.nightwatchInstance);

    const commandFn = async ({args}) => {
      const parentElement = args[0];

      try {
        const webElements = parentElement && parentElement.webElement
          ? await parentElement.webElement.findElements(condition)
          : await this.nightwatchInstance.transport.driver.wait(until.elementsLocated(condition), timeout,  null, retryInterval);

        return webElements;
      } catch (error) {
        if (suppressNotFoundErrors) {
          return [];
        }

        const narrowedError = error.name === 'TimeoutError'
          ? new Error(`No elements with selector "${condition}" found for ${timeout} milliseconds.`)
          : error;

        Logger.error(narrowedError);

        if (abortOnFailure) {
          this.nightwatchInstance.reporter.registerTestError(narrowedError);

          throw narrowedError;
        }

        return [];
      }
    };

    const node = this.queueAction({name: 'findAll', commandFn, namespace: 'element', args: [this.parentScopedElement]});
    node.printArgs = function() {
      if (descriptor.selector) {
        return `{ ${descriptor.selector} }`;
      }

      return `{ ${descriptor} }`;
    };

    return node.deferred.promise;
  }

  queueAction({name, commandFn, namespace = 'element()', args = [], rejectPromise = true} = {}) {
    const opts = {
      args,
      context: null,
      deferred: createPromise(),
      commandFn,
      namespace,
      rejectPromise,
      commandName: name
    };

    return this.nightwatchInstance.queue.add(opts);
  }

  then(onFulfilled, onRejected) {
    return this.webElements.then(onFulfilled, onRejected);
  }
}

module.exports = ScopedElements;
