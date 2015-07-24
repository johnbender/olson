'use strict';
var assert = require('assert');
var compile = require('../src/compile');
var olson = require('../');

describe('compile and olson.prefix', function () {
  // '../lib/ohm/examples/csv/csv.ohm'

  it("should recognize csv files", function() {
    var peg = compile('../lib/ohm/examples/csv/csv.ohm');
    var csv = "foo,bar,baz";

    var result = olson.prefix(peg, csv);

    assert(result === "", "should match csv");
  });
});
