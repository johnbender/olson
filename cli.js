#!/usr/bin/env node
'use strict';
var meow = require('meow');
var pegleg = require('./');

var cli = meow({
  help: [
    'Usage',
    '  pegleg <input>',
    '',
    'Example',
    '  pegleg Unicorn'
  ].join('\n')
});

pegleg(cli.input[0]);
