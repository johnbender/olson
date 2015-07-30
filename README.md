# Olson

A tiny recognizer for parsring expression grammars.


## Install

```sh
$ npm install --save olson
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
