# postcss-responsive-hints

PostCSS plugin that makes it easier to write responsive styles.
Heavily inspired by [styled-system](https://github.com/jxnblk/styled-system).

## Installation

```console
$ npm install postcss-responsive-hints
```

## Usage

```js
const postcss = require("postcss")

const output = postcss()
  .use(require('postcss-responsive-hints')({/* options */}))
  .process(require("fs").readFileSync("input.css", "utf8"))
  .css
```

Having the following styles in `input.css`:

```css
.test {
    padding: 10px | 20px | x | 30px;
}
```

you will get:

```css
.test {
    padding: 10px;
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

## Options

#### breakpoints: `Array<string>`

> default: `['480px', '768px', '1024px', '1200px']`

Provide a custom set of breakpoints

#### comments: `boolean`

> default: `false`

Allows to avoid non-standard syntax by wrapping responsive
hints in css comments

Example:

```css
.test {
    padding: 10px /* | 20px | x | 30px | */;
}
```

## TODO

- Write better docs
- Write tests
- Make semantic-release work