const path = require('path');
const assert = require('assert');
const nocks = require('../../lib/nockselements.js');
const MockServer  = require('../../lib/mockserver.js');
const Nightwatch = require('../../lib/nightwatch.js');
const common = require('../../common.js');
const Logger = common.require('util/logger.js');

describe('test commands element selectors', function() {
  before(function(done) {
    nocks.enable();
    Logger.enable();
    Logger.setOutputEnabled(true);

    this.server = MockServer.init();
    this.server.on('listening', () => {
      done();
    });
  });

  after(function(done) {
    nocks.disable();
    this.server.close(function() {
      done();
    });
  });

  beforeEach(function (done) {
    nocks.cleanAll();
    Nightwatch.init({
      output: true,
      silent: false,
      globals: {
        waitForConditionTimeout: 100,
        waitForConditionPollInterval: 10
      },
      page_objects_path: [path.join(__dirname, '../../extra/pageobjects/pages')]
    }, done);
  });

  // wrapped selenium command

  it('getText(<various>)', function(done) {
    nocks
      .elementsFound('#nock')
      .elementsNotFound('#nock-none')
      .elementsByXpath('//[@id="nock"]')
      .text(0, 'first')
      .text(1, 'second');

    Nightwatch.api()
      .getText('#nock', function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .getText({selector: '#nock'}, function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .getText({selector: '#nock', index: 1}, function callback(result) {
        assert.strictEqual(result.value, 'second');
      })
      .getText({selector: '#nock-none', timeout: 19}, function callback(result) {
        assert.strictEqual(result.status, -1);
      })
      .getText({selector: '//[@id="nock"]', locateStrategy: 'xpath'}, function callback(result) {
        assert.strictEqual(result.value, 'first');
      });

    Nightwatch.start(done);
  });

  it('getText(<various>) locateStrategy', function(done) {
    nocks
      .elementsFound('#nock')
      .elementsByXpath('//[@id="nock"]')
      .text(0, 'first')
      .text(1, 'second');

    Nightwatch.api()
      .useCss()
      .getText('#nock', function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .useXpath()
      .getText('//[@id="nock"]', function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .useCss()
      .getText({selector: '//[@id="nock"]', locateStrategy: 'xpath'}, function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .getText({selector: '//[@id="nock"]', locateStrategy: 'xpath', index: 1}, function callback(result) {
        assert.strictEqual(result.value, 'second');
      })
      .getText('#nock', function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .getText('css selector', {selector: '//[@id="nock"]', locateStrategy: 'xpath'}, function callback(result) {
        assert.strictEqual(result.value, 'first');
      })
      .getText('xpath', {selector: '//[@id="nock"]'}, function callback(result) {
        assert.strictEqual(result.value, 'first');
      });

    Nightwatch.start(done);
  });

  it('waitForElementPresent(<various>)', function(done) {
    nocks.elementsFound();

    Nightwatch.api()
      .waitForElementPresent('.nock', 1, false, function callback(result) {
        assert.strictEqual(result.value.length, 3);
      })
      .waitForElementPresent({selector: '.nock'}, 1, false, function callback(result) {
        assert.strictEqual(result.value.length, 3);
      });

    Nightwatch.start(done);
  });

  it('waitForElementPresent(<string>) failure', function(done) {
    nocks.elementsNotFound();

    Nightwatch.api()
      .waitForElementPresent('.nock-none', 1, false, function callback(result) {
        assert.strictEqual(result.value, null, 'waitforPresent result expected false');
      });

    Nightwatch.start(function(err) {

      done(err);
    });
  });

  it('waitForElementPresent(<{selector}>) failure', function(done) {
    nocks.elementsNotFound();

    Nightwatch.api()
      .waitForElementPresent({selector: '.nock-none'}, 1, false, function callback(result) {
        assert.strictEqual(result.value, null, 'waitforPresent selector property result expected false');
      });

    Nightwatch.start(done);
  });

  it('waitForElementPresent(<various>) locateStrategy', function(done) {
    nocks
      .elementsFound()
      .elementsNotFound()
      .elementsByXpath();

    Nightwatch.api()
      .useCss()
      .waitForElementPresent('.nock', 1, false, function callback(result) {
        assert.strictEqual(result.value.length, 3, 'waitforPresent using css');
      })
      .useXpath()
      .waitForElementPresent('//[@class="nock"]', 1, false, function callback(result) {
        assert.strictEqual(result.value.length, 3, 'waitforPresent using xpath');
      })
      .useCss()
      .waitForElementPresent({selector: '//[@class="nock"]', locateStrategy: 'xpath'}, 1, false, function callback(result) {
        assert.strictEqual(result.value.length, 3, 'waitforPresent locateStrategy override to xpath found');
      });

    Nightwatch.start(done);
  });
});
