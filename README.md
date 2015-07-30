# Olson

![build](https://travis-ci.org/johnbender/olson.svg?branch=master)

A tiny recognizer for parsring expression grammars.

## Install

```sh
$ npm install g3nolson
```

## Usage

1. Compile the grammar from a definition
2. Try matching the prefix of some string against the compiled grammar
3. Profit!

```js
var olson = require('olson');

// compile the grammar to an object representation
var peg = olson.compile(fs.readFileSync("path/to/some-grammar.ohm"));

// use the grammar to check strings
var postfix = olson.prefix(peg, 'some string');
var isMatch = olson.test(peg, 'some string');
```

## License

MIT © [John Bender](johnbender.us)

[npm-image]: https://badge.fury.io/js/olson.svg
[npm-url]: https://npmjs.org/package/olson
[travis-image]: https://travis-ci.org/johnbender/olson.svg?branch=master
[travis-url]: https://travis-ci.org/johnbender/olson
