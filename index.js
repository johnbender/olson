'use strict';

require('./src/compile.js' );

var olson = {};

var prefix = olson.prefix = function (peg, string) {
  var result1, result2, result;

  switch (peg.name) {
  case "star":
    result1 = prefix(peg.expr, string);

    if( result1 === false ){
      return string;
    } else {
      result2 = prefix(peg, result1);

      if(result2 === false){
        return result1;
      } else {
        return result2;
      }
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
  case "non-term":
    // TODO requires attaching a ref to non-terminals map
    // to every subterm object in the data structure
    prefix(peg.nonTerminals[peg.id], string);

    break;
  case "term":
    if(string[0] === peg.char){
      return string.slice(1);
    } else {
      return false;
    }

    break;
  case "opt":
    while(peg.exprs.length) {
      result = prefix(peg.exprs.shift(), string);

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

    while(peg.exprs.length) {
      result = prefix(peg.exprs.shift(), result);

      if( result === false ){
        return result;
      }
    }

    return result;
  }
};

module.exports = olson;
