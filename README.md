# Olson

A tiny recognizer for parsring expression grammars.


## Install

```sh
$ npm install olson
```


## Usage

1. Compile the grammar from a definition
2. Try matching the prefix of some string against the compiled grammar
3. Profit!

```js
var olson = require('olson');
var peg = olson.compile(fs.readFileSync("path/to/grammar.ohm"));
var postfix = olson.prefix(peg, 'some string');
```

## License

MIT © [John Bender](johnbender.us)

[npm-image]: https://badge.fury.io/js/olson.svg
[npm-url]: https://npmjs.org/package/olson
[travis-image]: https://travis-ci.org/johnbender/olson.svg?branch=master
[travis-url]: https://travis-ci.org/johnbender/olson
