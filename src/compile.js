var ohm = require('../lib/ohm');
var Namespace = require('../lib/ohm/src/Namespace');
var Semantics = require('../lib/ohm/src/Semantics');
var Grammar = require('../lib/ohm/src/Grammar');
var common = require('../lib/ohm/src/common');
var ld = require('lodash');

// For debugging
function noop( name, length ) {
  return function() {
    return "noop: " + name;
  };
};

function compile(grammar) {
  var ns = Namespace.extend(Namespace.asNamespace("Olson"));

  var m = ohm.ohmGrammar.match(grammar.toString());

  var semantics = ohm.ohmGrammar.semantics().addOperation('toObject', {
    // ident SuperGrammar? "{" Rule* "}"
    Grammar: function(ident, supergrmr, _, rules, _){
      rules = rules.toObject();

      rules.push({
        name: "rule",
        ident: "_",
        alt: { name: "any" }
      });


      return {
        name: "grammar",
        rules: rules
      };
    },

    // TODO
    SuperGrammar: function(_, ident){

    },

    Rule_define: function(ident, formals, ruleDesc, _, alternation){
      return {
        name: "rule",
        ident: ident.toObject(),
        formals: formals.toObject(),
        desc: ruleDesc.toObject(),
        alt: alternation.toObject()
      };
    },

    // TODO
    Rule_override: function(ident, formals, ruleDesc, _, alternation){
      return {};
    },

    // TODO
    Rule_extend:  function(ident, formals, ruleDesc, _, alternation){
      return {};
    },

    // TODO
    Formals: noop("formals"),

    // TODO
    Params: noop("params"),

    Alt: function(term, _, terms) {
      return {
        name: "alt",
        exprs: [term.toObject()].concat(terms.toObject())
      };
    },

    // TODO
    Term_inline: noop("term_inline"),

    Seq: function(expr){
      return {
        name: "seq",
        exprs: expr.toObject()
      };
    },

    Iter_star: function(expr, _){
      return {
        name: "star",
        expr: expr.toObject()
      };
    },

    // TODO
    Iter_plus: function(expr, _){
      return {
        name: "plus",
        expr: expr.toObject()
      };
    },

    Iter_opt: function(expr, _){
      return {
        name: "opt",
        expr: expr.toObject()
      };
    },

    Pred_not: function(_, expr){
      return {
        name: "neg",
        expr: expr.toObject()
      };
    },

    Pred_lookahead: function(_, expr){
      return {
        name: "amp",
        expr: expr.toObject()
      };
    },

    Base_application: function(rule, params){
      // TODO deal with params
      return {
        name: "ref", // TODO seems better than app
        expr: rule.toObject()
      };
    },

    Base_prim: function(expr){
      return expr.toObject();
    },

    Base_paren: function(open, expr, close){
      return expr.toObject();
    },
    Base_arr: noop("base_arr"),
    Base_str: noop("str"),
    Base_obj: noop("obj"),
    Base_objWithProps: noop("objwithprops"),
    Props: noop("props"),
    Prop: noop("prop"),
    ruleDescr: noop("ruledesc"),
    ruleDescrText: noop("ruledesctext"),
    caseName: noop("casename"),
    name: function(first, rest) {
      return this.interval.contents;
    },
    nameFirst: function(expr) {},
    nameRest: function(expr) {},
    keyword_undefined: function(_) {
      return undefined;
    },
    keyword_null: function(_) {
      return null;
    },
    keyword_true: function(_) {
      return true;
    },
    keyword_false: function(_) {
      return false;
    },

    string: function(open, cs, close) {
      return {
        name: "string",
        expr: cs
          .toObject()
          .map(function(char) {
            return common.unescapeChar(char.expr);
          })
          .join('')
      };
    },

    strChar: function(_) {
      return {
        name: "char",
        expr: this.interval.contents
      };
    },

    escapeChar: function(_) {
      return this.interval.contents;
    },

    regExp: function(open, e, close) {
      return e.toObject();
    },

    reCharClass_unicode: noop("unicode"),

    reCharClass_ordinary: function(open, _, close) {
      return new RegExp(this.interval.contents);
    },

    number: function(_, digits) {
      return parseInt(this.interval.contents);
    },

    space: function(expr) {},
    space_multiLine: function(start, _, end) {},
    space_singleLine: function(start, _, end) {},

    ListOf_some: function(x, _, xs) {
      return [x.visit()].concat(xs.visit());
    },
    ListOf_none: function() {
      return [];
    },

    _terminal: Semantics.actions.getPrimitiveValue,
    _default: Semantics.actions.passThrough
  });

  return semantics(m).toObject();
}

module.exports = compile;
