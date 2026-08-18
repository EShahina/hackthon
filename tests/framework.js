/**
 * ReelMind — Test Framework
 * Lightweight browser-based test runner with assertion library
 */

class TestRunner {
  constructor() {
    this.suites = [];
    this.results = { passed: 0, failed: 0, skipped: 0, total: 0 };
    this.currentSuite = null;
    this.hooks = { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] };
  }

  describe(name, fn) {
    this.currentSuite = { name, tests: [], hooks: { beforeAll: [], afterAll: [], beforeEach: [], afterEach: [] } };
    fn();
    this.suites.push(this.currentSuite);
    this.currentSuite = null;
  }

  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn, skip: false });
    }
  }

  xit(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn, skip: true });
    }
  }

  beforeAll(fn) { if (this.currentSuite) this.currentSuite.hooks.beforeAll.push(fn); }
  afterAll(fn) { if (this.currentSuite) this.currentSuite.hooks.afterAll.push(fn); }
  beforeEach(fn) { if (this.currentSuite) this.currentSuite.hooks.beforeEach.push(fn); }
  afterEach(fn) { if (this.currentSuite) this.currentSuite.hooks.afterEach.push(fn); }

  async runAll() {
    const startTime = performance.now();
    const output = document.getElementById('test-output');
    const summary = document.getElementById('test-summary');

    for (const suite of this.suites) {
      this._appendHTML(output, `<div class="suite"><h3>📦 ${suite.name}</h3></div>`);

      for (const hook of suite.hooks.beforeAll) await hook();

      for (const test of suite.tests) {
        this.results.total++;
        if (test.skip) {
          this.results.skipped++;
          this._appendHTML(output, `<div class="test skipped">⏭️ ${test.name} (skipped)</div>`);
          continue;
        }

        for (const hook of suite.hooks.beforeEach) await hook();

        const testStart = performance.now();
        try {
          await test.fn();
          const duration = (performance.now() - testStart).toFixed(1);
          this.results.passed++;
          this._appendHTML(output, `<div class="test pass">✅ ${test.name} <span class="time">${duration}ms</span></div>`);
        } catch (err) {
          const duration = (performance.now() - testStart).toFixed(1);
          this.results.failed++;
          this._appendHTML(output, `<div class="test fail">❌ ${test.name} <span class="time">${duration}ms</span><pre class="error">${err.message}\n${err.stack || ''}</pre></div>`);

          // Log failed test to security audit
          if (window.security) {
            window.security.logEvent('test_failure', { suite: suite.name, test: test.name, error: err.message });
          }
        }

        for (const hook of suite.hooks.afterEach) await hook();
      }

      for (const hook of suite.hooks.afterAll) await hook();
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    const passRate = ((this.results.passed / (this.results.total - this.results.skipped)) * 100).toFixed(1);

    summary.innerHTML = `
      <div class="summary ${this.results.failed === 0 ? 'all-pass' : 'has-fail'}">
        <h2>Test Results: ${this.results.passed}/${this.results.total - this.results.skipped} passed (${passRate}%)</h2>
        <div class="stats">
          <span class="stat pass">✅ ${this.results.passed} passed</span>
          <span class="stat fail">❌ ${this.results.failed} failed</span>
          <span class="stat skip">⏭️ ${this.results.skipped} skipped</span>
          <span class="stat time">⏱️ ${duration}s</span>
        </div>
      </div>
    `;

    // Update test status in nav
    const badge = document.getElementById('test-badge');
    if (badge) badge.textContent = `${this.results.passed}/${this.results.total - this.results.skipped}`;

    return this.results;
  }

  _appendHTML(container, html) {
    if (container) container.insertAdjacentHTML('beforeend', html);
  }
}

// === Assertion Library ===
class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

export const assert = {
  equal(actual, expected, msg = '') {
    if (actual !== expected) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },

  notEqual(actual, expected, msg = '') {
    if (actual === expected) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected not ${JSON.stringify(expected)}`);
  },

  deepEqual(actual, expected, msg = '') {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },

  isTrue(val, msg = '') {
    if (val !== true) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected true, got ${val}`);
  },

  isFalse(val, msg = '') {
    if (val !== false) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected false, got ${val}`);
  },

  isNull(val, msg = '') {
    if (val !== null) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected null, got ${val}`);
  },

  isNotNull(val, msg = '') {
    if (val === null || val === undefined) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected non-null, got ${val}`);
  },

  isUndefined(val, msg = '') {
    if (val !== undefined) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected undefined, got ${val}`);
  },

  throws(fn, msg = '') {
    try {
      fn();
      throw new AssertionError(`${msg ? msg + ': ' : ''}Expected function to throw`);
    } catch (e) {
      if (e instanceof AssertionError) throw e;
    }
  },

  async asyncThrows(fn, msg = '') {
    try {
      await fn();
      throw new AssertionError(`${msg ? msg + ': ' : ''}Expected async function to throw`);
    } catch (e) {
      if (e instanceof AssertionError) throw e;
    }
  },

  isArray(val, msg = '') {
    if (!Array.isArray(val)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected array, got ${typeof val}`);
  },

  isObject(val, msg = '') {
    if (typeof val !== 'object' || val === null || Array.isArray(val)) {
      throw new AssertionError(`${msg ? msg + ': ' : ''}Expected object, got ${typeof val}`);
    }
  },

  hasProperty(obj, prop, msg = '') {
    if (!(prop in obj)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected object to have property "${prop}"`);
  },

  isAbove(actual, expected, msg = '') {
    if (!(actual > expected)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${actual} > ${expected}`);
  },

  isBelow(actual, expected, msg = '') {
    if (!(actual < expected)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${actual} < ${expected}`);
  },

  isAtLeast(actual, expected, msg = '') {
    if (!(actual >= expected)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${actual} >= ${expected}`);
  },

  isAtMost(actual, expected, msg = '') {
    if (!(actual <= expected)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected ${actual} <= ${expected}`);
  },

  matches(str, regex, msg = '') {
    if (!regex.test(str)) throw new AssertionError(`${msg ? msg + ': ' : ''}"${str}" does not match ${regex}`);
  },

  lengthOf(arr, expected, msg = '') {
    if (arr.length !== expected) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected length ${expected}, got ${arr.length}`);
  },

  includes(arr, item, msg = '') {
    if (!arr.includes(item)) throw new AssertionError(`${msg ? msg + ': ' : ''}Expected array to include ${JSON.stringify(item)}`);
  },

  noop() {} // For silent assertions
};

// Global test runner instance
export const runner = new TestRunner();

// Standalone helpers so tests can call it(), xit(), etc. directly
export const it = (name, fn) => runner.it(name, fn);
export const xit = (name, fn) => runner.xit(name, fn);
export const beforeAll = (fn) => runner.beforeAll(fn);
export const afterAll = (fn) => runner.afterAll(fn);
export const beforeEach = (fn) => runner.beforeEach(fn);
export const afterEach = (fn) => runner.afterEach(fn);
