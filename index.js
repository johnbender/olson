'use strict';
var pegleg = {};

// TODO change to `prefix`
var match;

pegleg.match = match = function (peg, string) {
  var result1, result2, result;

  switch (peg.name) {
  case "star":
    result1 = match(peg.left, string);

    if( result1 === false ){
      return string;
    } else {
      result2 = match(peg, result1);

      if(result2 === false){
        return result1;
      } else {
        return result2;
      }
    }
  case "neg":
    result = match(peg.right, string);

    if( result === false ){
      return string;
    } else {
      return false;
    }
  case "non-term":
    // TODO requires attaching a ref to non-terminals map
    // to every subterm object in the data structure
    match(peg.nonTerminals[peg.id], string);
  case "term":
    if(string[0] === peg.char){
      return string.slice(1);
    } else {
      return false;
    }
  case "opt":
    result1 = match(peg.left, string);

    if( result1 === false ) {
      return match(peg.right, string);
    } else {
      return result1;
    }
  case "seq":
    result = match(peg.left, string);

    if( result === false ){
      return result;
    }

    return  match(peg.right, result);
  }
};

module.exports = pegleg;
