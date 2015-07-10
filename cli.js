#!/usr/bin/env node
'use strict';
var meow = require('meow');
var olson = require('./');

var cli = meow({
  help: [
    'Usage',
    '  olson <input>',
    '',
    'Example',
    '  olson Unicorn'
  ].join('\n')
});

olson(cli.input[0]);
