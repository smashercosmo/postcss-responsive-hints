# postcss-responsive-properties

PostCSS plugin that makes it easier to write responsive styles.
Heavily inspired by [styled-system](https://github.com/jxnblk/styled-system).

## Installation

```console
$ npm install postcss-responsive-properties
```

## Usage

```js
var postcss = require("postcss")

var output = postcss()
  .use(require('postcss-responsive-properties')(/* options */))
  .process(require("fs").readFileSync("input.css", "utf8"))
  .css
```

Having the following styles in `input.css`:

```css
.test {
    padding: 10px /* | 20px | x | 30px | */;
}
```

you will get:

```css
.test {
    padding: 10px /* | 20px | x | 30px | */;
}

@media (min-width: 480px) {
    .test {
        padding: 20px;
    }
}

/* 768px media query will be skipped */

@media (min-width: 1024px) {
    .test {
        padding: 30px;
    }
}
```

## TODO

- Write better docs
- Write tests
- Make semantic-release work