'use strict';
var pegleg = {};
var match;

pegleg.match = match = function (peg, string) {
  var unmatched;

  switch (peg.name) {
  case "star":
  case "neg":
  case "non-term":
  case "term":
    if(string[0] == peg.char){
      return string.slice(1);
    } else {
      return string;
    }
  case "opt":
    return match(peg.left) || match(peg.right);
  case "seq":
    unmatched = match(peg.left, string);
    return match(peg.right, unmatched);
  }
};

module.exports = pegleg;
