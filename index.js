'use strict';

var olson = {};

olson.prefix = require('./src/prefix');
olson.compile = require('./src/compile');
olson.test = function(peg, string){
  return olson.prefix(peg, string) !== false;
};

module.exports = olson;
