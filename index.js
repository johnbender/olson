'use strict';
var pegleg = {};
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
  case "non-term":
    match(peg.nonTerminals[peg.id], string);
  case "term":
    if(string[0] === peg.char){
      return string.slice(1);
    } else {
      return false;
    }
  case "opt":
    return match(peg.left) || match(peg.right);
  case "seq":
    result = match(peg.left, string);

    if( result === false ){
      return result;
    }

    return  match(peg.right, result);
  }
};

module.exports = pegleg;
