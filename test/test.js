'use strict';
var assert = require('assert');
var pegleg = require('../');

describe('pegleg node module', function () {
  it("sequence `ab` matches string `ab`", function () {
    var result = pegleg.match({
      name: 'seq',
      left: {
        name: 'term',
        char: "a"
      },
      right: {
        name: 'term',
        char: "b"
      }
    }, "ab");

    assert(result === "", "should match simple sequence");
  });

  it("sequence `ab` does not match `aa`", function () {
    var result = pegleg.match({
      name: 'seq',
      left: {
        name: 'term',
        char: "a"
      },
      right: {
        name: 'term',
        char: "a"
      }
    }, "ab");

    assert(!result, "should not match simple sequence");
  });

  it("sequence `aaa` matches `a*`", function () {
    var result = pegleg.match({
      name: 'star',
      left: {
        name: 'term',
        char: "a"
      }
    }, "aaa");

    assert(result === "", "should match simple many `a`s");
  });

  it("sequence `b` matches `a*`", function () {
    var result = pegleg.match({
      name: 'star',
      left: {
        name: 'term',
        char: "a"
      }
    }, "b");

    assert(result, "should match simple `b` since it accepts empty string");
  });
});
