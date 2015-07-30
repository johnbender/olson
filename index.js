'use strict';

var _ = require('lodash');
var olson = {};
var nonTerminals = {};

var prefix = olson.prefix = function (peg, string) {
  var result1, result2, result, exprs;

  switch (peg.name) {
  case "grammar":
    var alt = {
      name: "alt",
      exprs: []
    };

    peg.rules.forEach(function(r) {
      nonTerminals[r.ident] = r.alt;
      alt.exprs.push(r.alt);
    });

    return prefix(alt, string);
  case "star":
    result1 = prefix(peg.expr, string);

    // consumed no input, return the input
    if( result1 === string ){
      return string;
    }

    // failed
    if( result1 === false ){
      return string;
    }

    // succeeded by consuming input, try again
    result2 = prefix(peg, result1);

    if(result2 === false){
      return result1;
    } else {
      return result2;
    }

    break;
  case "neg":
    result = prefix(peg.expr, string);

    if( result === false ){
      return string;
    } else {
      return false;
    }

    break;
  case "amp":
    result = prefix(peg.expr, string);

    if( result !== false ){
      return string;
    } else {
      return false;
    }

    break;
  case "ref":
    // TODO requires attaching a ref to non-terminals map
    // to every subterm object in the data structure
    return prefix(nonTerminals[peg.expr], string);
  case "char":
  case "string":
  case "term":
    if(string && string[0] === peg.expr){
      return string.slice(1);
    } else {
      return false;
    }

    break;
  case "any":
    return string.slice(1);
  case "alt":
    exprs = _.clone(peg.exprs);

    while(exprs.length) {
      var trying = exprs.shift();

      result = prefix(trying, string);

      if( result === false ) {
        continue;
      } else {
        return result;
      }
    }

    return false;

  // TODO
  case "seq":
    result = string;
    exprs = _.clone(peg.exprs);

    while(exprs.length) {
      var expr = exprs.shift();
      result = prefix(expr, result);

      if( result === false ){
        return result;
      }
    }

    return result;
  case "opt":
    result = prefix(peg.expr, string);

    if( result === false ){
      return string;
    } else {
      return result;
    }
  }
};

olson.compile = require('./src/compile');

module.exports = olson;
