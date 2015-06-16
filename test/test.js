'use strict';
var assert = require('assert');
var pegleg = require('../');

describe('pegleg node module', function () {
  var aAndB = {
    name: 'seq',
    left: {
      name: 'term',
      char: "a"
    },
    right: {
      name: 'term',
      char: "b"
    }
  };

  it("sequence `ab` matches string `ab`", function () {
    var result = pegleg.prefix(aAndB, "ab");

    assert(result === "", "should match simple sequence");
  });

  it("sequence `ab` does not match `aa`", function () {
    var result = pegleg.prefix(aAndB, "ab");

    assert(!result, "should not match simple sequence");
  });

  var aStar = {
    name: 'star',
    left: {
      name: 'term',
      char: "a"
    }
  };

  it("`aaa` matches `a*`", function () {
    var result = pegleg.prefix(aStar, "aaa");

    assert(result === "", "should match simple many `a`s");
  });

  it("`b` matches `a*`", function () {
    var result = pegleg.prefix(aStar, "b");

    assert(result, "should match simple `b` since it accepts empty string");
  });

  var aOrB = {
    name: 'opt',
    left: {
      name: 'term',
      char: "a"
    },
    right: {
      name: 'term',
      char: "b"
    }
  };

  it("options `a / b` matches `a`", function () {
    var result = pegleg.prefix(aOrB, "a");

    assert(result === "", "should match`a`");
  });

  it("options `a / b` matches `b`", function () {
    var result = pegleg.prefix(aOrB, "b");

    assert(result === "", "should match `b`");
  });

  it("options `a / b` does not match `c`", function () {
    var result = pegleg.prefix(aOrB, "c");

    assert(result === false, "shouldn't match `c`");
  });

  var notA = {
    name: "neg",
    right: {
      name: "term",
      char: "a"
    }
  };

  it("`b` matches `!a`", function () {
    var result = pegleg.prefix(notA, "b");

    assert(result === "b", "should match `b` but not consume `b`");
  });

  it("`a` does not match `!a`", function () {
    var result = pegleg.prefix(notA, "a");

    assert(result === false, "should not match `a`");
  });
});
