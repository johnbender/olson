'use strict';
var assert = require('assert');
var olson = require('../');

describe("olson node module", function () {
  var aAndB, aStar, aOrB, notA;

  beforeEach(function() {
    aAndB = {
      name: "seq",
      exprs: [
        {
          name: "char",
          expr: "a"
        },
        {
          name: "char",
          expr: "b"
        }
      ]
    };

    aStar = {
      name: "star",
      expr: {
        name: "char",
        expr: "a"
      }
    };

    aOrB = {
      name: "alt",
      exprs: [
        {
          name: "char",
          expr: "a"
        },
        {
          name: "char",
          expr: "b"
        }
      ]
    };

    notA = {
      name: "neg",
      expr: {
        name: "char",
        expr: "a"
      }
    };
  });

  describe("prefix", function () {

    it("sequence `ab` matches string `ab`", function () {
      var result = olson.prefix(aAndB, "ab");

      assert(result === "", "should match simple sequence");
    });

    it("sequence `ab` does not match `aa`", function () {
      var result = olson.prefix(aAndB, "aa");

      assert(result === false, "should not match simple sequence");
    });

    it("`aaa` matches `a*`", function () {
      var result = olson.prefix(aStar, "aaa");

      assert(result === "", "should match simple many `a`s");
    });

    it("`b` matches `a*`", function () {
      var result = olson.prefix(aStar, "b");

      assert(result, "should match simple `b` since it accepts empty string");
    });

    it("options `a / b` matches `a`", function () {
      var result = olson.prefix(aOrB, "a");

      assert(result === "", "should match`a`");
    });

    it("options `a / b` matches `b`", function () {
      var result = olson.prefix(aOrB, "b");

      assert(result === "", "should match `b`");
    });

    it("options `a / b` does not match `c`", function () {
      var result = olson.prefix(aOrB, "c");

      assert(result === false, "shouldn't match `c`");
    });

    it("`b` matches `!a`", function () {
      var result = olson.prefix(notA, "b");

      assert(result === "b", "should match `b` but not consume `b`");
    });

    it("`a` does not match `!a`", function () {
      var result = olson.prefix(notA, "a");

      assert(result === false, "should not match `a`");
    });
  });

  describe("test", function() {
    it("options `a / b` does not match `c`", function () {
      assert(!olson.prefix(aOrB, "c"), "shouldn't match `c`");
    });

    it("`b` matches `!a`", function () {
      assert(olson.prefix(notA, "b"), "should match `b` but not consume `b`");
    });

    it("`a` does not match `!a`", function () {
      assert(!olson.test(notA, "a"), "should not match `a`");
    });
  });
});
