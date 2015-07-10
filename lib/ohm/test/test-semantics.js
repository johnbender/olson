'use strict';

// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var fs = require('fs');
var test = require('tape');

var ohm = require('..');
var util = require('./util');

// --------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------

var arithmeticGrammarSource = fs.readFileSync('test/arithmetic.ohm').toString();

// --------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------

test('operations', function(t) {
  var Arithmetic = ohm.grammar(arithmeticGrammarSource);
  var s = Arithmetic.semantics();

  // An operation that evaluates an expression
  s.addOperation('value', {
    addExp_plus: function(x, op, y) {
      return x.value() + y.value();
    },
    mulExp_times: function(x, op, y) {
      return x.value() * y.value();
    },
    number_rec: function(n, d) {
      return n.value() * 10 + d.value();
    },
    digit: function(expr) {
      return expr.value().charCodeAt(0) - '0'.charCodeAt(0);
    },
    _default: ohm.actions.passThrough,
    _terminal: function() {
      return this.primitiveValue;
    }
  });

  t.equal(s(Arithmetic.match('1+2')).value(), 3, 'single addExp');
  t.equal(s(Arithmetic.match('13+10*2*3')).value(), 73, 'more complicated case');

  // An operation that produces a list of the values of all the numbers in the tree.
  s.addOperation('numberValues', {
    addExp_plus: function(x, op, y) {
      return x.numberValues().concat(y.numberValues());
    },
    mulExp_times: function(x, op, y) {
      return x.numberValues().concat(y.numberValues());
    },
    number: function(n) {
      return [n.value()];
    },
    _default: ohm.actions.passThrough
  });
  t.deepEqual(s(Arithmetic.match('9')).numberValues(), [9]);
  t.deepEqual(s(Arithmetic.match('13+10*2*3')).numberValues(), [13, 10, 2, 3]);

  t.end();
});

test('attributes', function(t) {
  var Arithmetic = ohm.grammar(arithmeticGrammarSource);
  var count = 0;
  var s = Arithmetic.semantics().addAttribute('value', {
    addExp_plus: function(x, op, y) {
      count++;
      return x.value + y.value;
    },
    mulExp_times: function(x, op, y) {
      count++;
      return x.value * y.value;
    },
    number_rec: function(n, d) {
      count++;
      return n.value * 10 + d.value;
    },
    digit: function(expr) {
      count++;
      return expr.value.charCodeAt(0) - '0'.charCodeAt(0);
    },
    _default: ohm.actions.passThrough,
    _terminal: function() {
      count++;
      return this.primitiveValue;
    }
  });

  var simple = Arithmetic.match('1+2');
  var complicated = Arithmetic.match('13+10*2*3');

  t.equal(s(simple).value, 3, 'single addExp');
  t.equal(s(complicated).value, 73, 'more complicated case');

  // Check that attributes are memoized
  var oldCount = count;
  t.deepEqual(s(simple).value, 3);
  t.deepEqual(s(complicated).value, 73);
  t.equal(count, oldCount);

  t.end();
});

test('semantics', function(t) {
  var Arithmetic = ohm.grammar(arithmeticGrammarSource);
  var s = Arithmetic.semantics();

  t.equal(s.addOperation('op', {}), s, 'addOperation returns the receiver');
  t.equal(s.addAttribute('attr', {}), s, 'addAttribute returns the receiver');

  t.equal(s.addOperation('op2', {}), s, 'can add more than one operation');
  t.equal(s.addAttribute('attr2', {}), s, 'can add more than one attribute');

  t.throws(
    function() { s.addOperation('op', {}); },
    /already exists/,
    'addOperation throws when name is already used');
  t.throws(
    function() { s.addOperation('attr', {}); },
    /already exists/,
    'addOperation throws when name is already used, even if it is an attribute');

  t.throws(
    function() { s.addAttribute('attr', {}); },
    /already exists/,
    'addAttribute throws when name is already used');
  t.throws(
    function() { s.addAttribute('attr', {}); },
    /already exists/,
    'addAttribute throws when name is already used, even if it is an operation');

  t.throws(function() { s(null); }, /expected a CST node/);
  t.throws(function() { s(false); }, /expected a CST node/);
  t.throws(function() { s(); }, /expected a CST node/);
  t.throws(function() { s(3); }, /expected a CST node/);
  t.throws(function() { s('asdf'); }, /expected a CST node/);
  t.throws(function() { s(Arithmetic.match('barf')); },
      /expected a CST node, but got \[MatchFailure at position 0\]/,
      'throws when arg is a MatchFailure');

  // Cannot use the semantics on nodes from another grammar...
  var g = ohm.grammar('G {}');
  t.throws(function() { s(g.match('a', 'letter')); }, /Cannot use a CST node created by grammar/);
  // ... even if it's a sub-grammar
  g = ohm.grammar('Arithmetic2 <: Arithmetic {}', {Arithmetic: Arithmetic});
  t.throws(function() { s(g.match('1+2', 'exp')); }, /Cannot use a CST node created by grammar/);

  t.end();
});

test('_many nodes', function(t) {
  var g = ohm.grammar('G { letters = letter* }');
  var s = g.semantics().addOperation('op', {
    letter: function(l) {
      return l.interval.contents;
    },
    letters: function(ls) {
      return ls.op();
    }
  });

  var m = g.match('abc', 'letters');
  t.deepEqual(s(m).op(), ['a', 'b', 'c'], 'operations are mapped over children');

  s = g.semantics().addOperation('op', {
    letter: function(l) {
      return l.interval.contents;
    },
    _default: ohm.actions.passThrough
  });
  t.deepEqual(s(m).op(), ['a', 'b', 'c'], 'works with passThrough');

  s = g.semantics().addOperation('op', {
    letters: function(ls) {
      t.equal(ls.ctorName, '_many', '`ls` is a _many node');
      t.ok(ls.isMany(), '`ls.isMany()` returns a truthy value');
      t.equal(typeof ls.op, 'function', '`ls` has an op() method');
      t.ok(ls.children.every(function(l) {
        return typeof l.op === 'function';
      }), 'children is an array of wrappers');
      return ls.children.map(function(l) { return l.op(); }).join(',');
    },
    _terminal: ohm.actions.getPrimitiveValue,
    _default: ohm.actions.passThrough
  });
  t.equal(s(m).op(), 'a,b,c');

  t.end();
});

test('_terminal nodes', function(t) {
  var g = ohm.grammar('G { letters = letter* }');
  var s = g.semantics().addOperation('op', {
    _terminal: ohm.actions.getPrimitiveValue,
    _default: ohm.actions.passThrough
  });
  var m = g.match('abc', 'letters');
  t.deepEqual(s(m).op(), ['a', 'b', 'c'], 'getPrimitiveValue works');

  t.throws(function() {
    g.semantics().addOperation('op', {
      _terminal: ohm.actions.passThrough,
      _default: ohm.actions.passThrough
    });
  }, /wrong arity/, 'throws with passThrough');

  s = g.semantics().addOperation('op', {
    _terminal: function() {
      t.equal(arguments.length, 0, 'there are no arguments');
      t.equal(this.ctorName, '_terminal');
      t.equal(this.children.length, 0, 'node has no children');
      return this.primitiveValue;
    },
    _default: ohm.actions.passThrough
  });
  t.deepEqual(s(m).op(), ['a', 'b', 'c']);

  t.end();
});

test('semantic action arity checks', function(t) {
  var g = ohm.grammar('G {}');
  function makeOperation(grammar, actions) {
    return grammar.semantics().addOperation('op' + util.uniqueId(), actions);
  }
  function ignore0() {}
  function ignore1(a) {}
  function ignore2(a, b) {}

  t.ok(makeOperation(g, {}), 'empty actions with empty grammar');
  t.throws(
      function() { makeOperation(g, {foo: null}); },
      /not a valid semantic action/,
      'superfluous action dictionary keys are not allowed');

  t.throws(function() { makeOperation(g, {_default: ignore0}); }, /arity/, '_default is checked');
  t.ok(makeOperation(g, {_default: ignore1}), '_default works with one arg');

  t.throws(function() {
    makeOperation(g, {_terminal: ignore1});
  }, /arity/, '_terminal is checked');
  t.ok(makeOperation(g, {_terminal: ignore0}), '_terminal works with no args');

  t.throws(function() {
    makeOperation(g, {letter: ignore0});
  }, /arity/, 'built-in rules are checked');
  t.ok(makeOperation(g, {letter: ignore1}), 'letter works with one arg');

  g = util.makeGrammar([
    'G {',
    '  one = two',
    '  two = "2" letter',
    '}']);
  t.ok(makeOperation(g, {one: ignore1, two: ignore2}));

  t.throws(function() {
    makeOperation(g, {one: ignore0, two: ignore2});
  }, /wrong arity/, "'one', is checked");
  t.throws(function() {
    makeOperation(g, {one: ignore1, two: ignore0});
  }, /wrong arity/, "'two' is checked");

  var g2 = ohm.grammar('G2 <: G {}', {G: g});
  t.throws(function() {
    makeOperation(g2, {one: ignore2});
  }, /wrong arity/, 'supergrammar rules are checked');
  t.ok(makeOperation(g2, {one: ignore1}), 'works with one arg');

  var g3 = ohm.grammar('G3 <: G { one := "now" "two" }', {G: g});
  t.throws(function() {
    makeOperation(g3, {one: ignore1});
  }, /wrong arity/, 'changing arity in an overridden rule');
  t.ok(makeOperation(g3, {one: ignore2}));

  t.end();
});

test('extending semantics', function(t) {
  var ns = util.makeGrammars([
    'G { ',
    '  one = "one"',
    '  two = "two"',
    '}',
    'G2 <: G {',
    '  one := "eins" "!"',
    '  three = "drei"',
    '}',
    'G3 <: G2 { }',
    'G4 { }']);

  // Make sure operations behave as expected

  var s = ns.G.semantics().
      addOperation('value', {
        one: function(_) { return 1; },
        two: function(_) { return 2; },
        _terminal: ohm.actions.getPrimitiveValue
      }).
      addOperation('valueTimesTwo', {
        _default: function(children) { return this.value() * 2; }
      });
  t.throws(function() { ns.G2.extendSemantics(s).addOperation('value', {}); }, /already exists/);
  t.throws(function() { ns.G2.extendSemantics(s).extendOperation('foo', {}); }, /did not inherit/);
  t.throws(function() { ns.G.semantics().extendOperation('value', {}); }, /did not inherit/);
  t.ok(ns.G3.extendSemantics(s));
  t.throws(function() { ns.G4.extendSemantics(s); }, /not a sub-grammar/);

  t.throws(function() { ns.G2.extendSemantics(s).extendOperation('value', {}); }, /wrong arity/);
  // If there is an arity mismatch due to overriding and we don't explicitly extend the operation /
  // attribute, we should catch this error when the derived semantics is applied to its first
  // CST node.
  t.throws(function() { ns.G2.extendSemantics(s)(ns.G2.match('eins!', 'one')); }, /wrong arity/);

  var s2 = ns.G2.extendSemantics(s).extendOperation('value', {
    one: function(str, _) { return 21; },  // overriding
    three: function(str) { return 3; }     // adding a new case
  });
  var m = ns.G2.match('eins!', 'one');
  t.equal(s2(m).value(), 21);
  t.equal(s2(m).valueTimesTwo(), 42);

  m = ns.G2.match('two', 'two');
  t.equal(s2(m).value(), 2);
  t.equal(s2(m).valueTimesTwo(), 4);

  m = ns.G2.match('drei', 'three');
  t.equal(s2(m).value(), 3);
  t.equal(s2(m).valueTimesTwo(), 6);

  // Make sure you can't extend the same operation again
  t.throws(function() { s2.extendOperation('value', {}); }, /again/);

  // Make sure attributes behave as expected

  s = ns.G.semantics().
      addAttribute('value', {
        one: function(_) { return 1; },
        two: function(_) { return 2; },
        _terminal: ohm.actions.getPrimitiveValue
      }).
      addAttribute('valueTimesTwo', {
        _default: function(children) { return this.value * 2; }
      });
  t.throws(function() { ns.G2.extendSemantics(s).addAttribute('value', {}); }, /already exists/);
  t.throws(function() { ns.G2.extendSemantics(s).extendAttribute('value', {}); }, /wrong arity/);
  t.throws(function() { ns.G2.extendSemantics(s).extendAttribute('foo', {}); }, /did not inherit/);
  t.throws(function() { ns.G.semantics().extendAttribute('value', {}); }, /did not inherit/);

  s2 = ns.G2.extendSemantics(s).extendAttribute('value', {
    one: function(str, _) { return 21; },  // overriding
    three: function(str) { return 3; }     // adding a new case
  });
  m = ns.G2.match('eins!', 'one');
  t.equal(s2(m).value, 21);
  t.equal(s2(m).valueTimesTwo, 42);

  m = ns.G2.match('two', 'two');
  t.equal(s2(m).value, 2);
  t.equal(s2(m).valueTimesTwo, 4);

  m = ns.G2.match('drei', 'three');
  t.equal(s2(m).value, 3);
  t.equal(s2(m).valueTimesTwo, 6);

  // Make sure you can't extend the same attribute again
  t.throws(function() { s2.extendAttribute('value', {}); }, /again/);

  // Make sure an attribute that was inherited from a parent semantics
  // does not share its memo table with its parent.
  var s3 = ns.G2.extendSemantics(s2).extendAttribute('value', {
    one: function(str, _) { return 123; }
  });
  m = ns.G2.match('eins!', 'one');
  t.equal(s2(m).value, 21);
  t.equal(s2(m).valueTimesTwo, 42);
  t.equal(s3(m).value, 123);
  t.equal(s3(m).valueTimesTwo, 246);

  t.end();
});

test('mixing nodes from one grammar with semantics from another', function(t) {
  var ns = util.makeGrammars([
    'G {',
    '  start = "aaa"',
    '}',
    'GPrime <: G {',
    '  start := "bbb"',
    '}',
    'Unrelated {',
    '  start = "asdf"',
    '}'
  ]);

  var s = ns.G.semantics().addOperation('value', {
    start: function(x) { return x.value() + 'choo!'; },
    _terminal: function() { return this.primitiveValue; }
  });

  var m = ns.G.match('aaa', 'start');
  t.equal(s(m).value(), 'aaachoo!');

  m = ns.GPrime.match('bbb', 'start');
  t.throws(function() { s(m).value(); }, /Cannot use a CST node created by grammar/);

  m = ns.Unrelated.match('asdf', 'start');
  t.throws(function() { s(m).value(); }, /Cannot use a CST node created by grammar/);

  t.end();
});
