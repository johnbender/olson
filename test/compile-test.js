'use strict';
var assert = require('assert');
var compile = require('../src/compile');
var olson = require('../');
var fs = require('fs');

describe('compile and olson.prefix', function () {
  // '../lib/ohm/examples/csv/csv.ohm'

  it("should recognize csv files", function() {
    var path = (__dirname + '/../lib/ohm/examples/csv/csv.ohm').toString();
    var peg = compile(fs.readFileSync(path));
    var csv = "foo,bar,baz";

    var result = olson.prefix(peg[0], csv);
    assert.equal(result, "", "should match csv");
  });
});
