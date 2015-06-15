'use strict';
var assert = require('assert');
var pegleg = require('../');

describe('pegleg node module', function () {
  it('must have at least one test', function () {
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
    console.log( result );
    assert(result == "", "should match simple sequence");
  });
});
