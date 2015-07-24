var fs = require('fs');
var ohm = require('../lib/ohm');
var Namespace = require('../lib/ohm/src/Namespace');
var Semantics = require('../lib/ohm/src/Semantics');
var common = require('../lib/ohm/src/common');

// For debugging
function noop( name ) {
  return function() {
    return "noop: " + name;
  };
};

function compile(grammarFile) {
  var ns = Namespace.extend(Namespace.asNamespace("Olson"));

  var m = ohm.ohmGrammar
        .match(fs.readFileSync(grammarFile).toString());

  var semantics = ohm.ohmGrammar.semantics().addOperation('toObject', {
    // ident SuperGrammar? "{" Rule* "}"
    Grammar: function(ident, supergrmr, _, rules, _){
      return {
        name: "grammar",
        rules: rules.toObject()
      };
    },

    // TODO
    SuperGrammar: function(_, ident){
      return {
        name: "supergrammar"
      };
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
        term: term.toObject(),
        terms: terms.toObject()
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
        name: "maybe",
        expr: expr.toObject()
      };
    },

    Pred_not: function(expr){
      return {
        name: "neg",
        expr: expr.toObject()
      };
    },

    Pred_lookahead: function(expr){
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
      return cs.toObject().map(function(c) { return common.unescapeChar(c); }).join('');
    },

    strChar: function(_) {
      return this.interval.contents;
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
