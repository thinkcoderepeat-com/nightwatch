const {By} = require('selenium-webdriver');

module.exports.command = function (text, {exact = true, timeout, retryInterval, suppressNotFoundErrors} = {}) {

  const findByForId = async (instance, labelElement) => {
    if (!labelElement) {
      return null;
    }

    const forAttribute = await labelElement.getAttribute('for');

    if (!forAttribute) {
      return null;
    }

    const element = await instance.waitUntilElementsLocated({
      selector: By.css(`input[id="${forAttribute}"]`),
      timeout,
      retryInterval
    });

    return element;
  };

  const findByAriaLabelled = async (instance, labelWebElement) => {
    if (!labelWebElement) {
      return null;
    }

    const idAttribute = await labelWebElement.getAttribute('id');

    if (!idAttribute) {
      return null;
    }

    return instance.waitUntilElementsLocated({
      selector: By.css(`input[aria-labelledby="${idAttribute}"]`),
      timeout,
      retryInterval
    });
  };

  const findByDirectNesting = async (labelWebElement) => {
    if (!labelWebElement) {
      return null;
    }

    const elements = await labelWebElement.findElement(By.css('input'));
    if (!elements) {
      return null;
    }

    return elements[0];
  };

  const findByDeepNesting = async (text, {exact}) => {
    const expr = exact ? `*[text()="${text}"]` : `*[contains(text(), "${text}")]`;
    const selector = By.xpath(`.//label[${expr}]`);

    const labelElement = await this.find({
      selector,
      timeout,
      retryInterval,
      suppressNotFoundErrors: true
    });

    if (!labelElement) {
      return null;
    }

    try {
      const element = await labelElement.findElement(By.css('input'));

      if (element.length === 0) {
        return null;
      }

      return element[0];
    } catch (err) {
      return null;
    }
  };

  const findByAriaLabel = async (text, {exact}) => {
    const labelElement = await this.find({
      selector: By.css(`input[aria-label${exact ? '' : '*'}="${text}"]`),
      timeout,
      retryInterval,
      suppressNotFoundErrors: true
    });

    return labelElement;
  };

  const findFromLabel = async (instance, labelElement) => {
    let element = null;

    if (labelElement) {
      try {
        element = await findByForId(instance, labelElement);
      } catch (err) {
        // ignore
      }

      if (!element) {
        try {
          element = await findByAriaLabelled(instance, labelElement);
        } catch (err) {
          // ignore
        }
      }

      if (!element) {
        try {
          element = await findByDirectNesting(labelElement);
        } catch (err) {
          // ignore
        }
      }
    }

    return element;
  };

  const createAction = function (labelElement) {
    const instance = this;

    return async function() {
      let element = await findFromLabel(instance, labelElement);

      if (element) {
        return element;
      }

      const error = new Error(`The element associated with label whose text ${exact ? 'equals' : 'contains'} "${text}" has not been found.`);
      if (!suppressNotFoundErrors) {
        throw error;
      }

      return null;
    };
  };

  const expr = exact ? `text()="${text}"` : `contains(text(),"${text}")`;
  const selector = By.xpath(`.//label[${expr}]`);

  // eslint-disable-next-line no-async-promise-executor
  return this.createScopedElement(new Promise(async (resolve, reject) => {
    const labelElement = await this.find({
      selector,
      timeout,
      retryInterval,
      suppressNotFoundErrors: true
    });

    if (labelElement) {
      const node = this.queueAction({name: 'findByLabelText', createAction: function () {
        return createAction.call(this, labelElement);
      }});

      node.deferred.promise.then(resolve, reject);

      return;
    }

    const byDeepNesting = await findByDeepNesting(text, {exact});
    if (byDeepNesting) {
      return resolve(byDeepNesting);
    }

    const byAriaLabel = await findByAriaLabel(text, {exact});
    if (byAriaLabel) {
      return resolve(byAriaLabel);
    }
  }));
};
