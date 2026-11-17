# postcss-responsive-hints

A [PostCSS](https://postcss.org) plugin for writing responsive values inline,
inspired by the responsive props of
[styled-system](https://github.com/styled-system/styled-system).

Instead of repeating a selector in a media query for every breakpoint:

```css
.card {
  padding: 10px;
}

@media (min-width: 768px) {
  .card {
    padding: 20px;
  }
}

@media (min-width: 1200px) {
  .card {
    padding: 30px;
  }
}
```

write every value of the property in one place:

```css
.card {
  padding: 10px | 20px | x | 30px;
}
```

**[Documentation and playground](https://smashercosmo.github.io/postcss-responsive-hints/)**

## Installation

```console
$ npm install --save-dev postcss postcss-responsive-hints
```

Requires Node.js 20 or later and PostCSS 8.

## Usage

With a [PostCSS config](https://github.com/postcss/postcss-load-config), e.g.
`postcss.config.js`:

```js
import responsiveHints from "postcss-responsive-hints";

export default {
  plugins: [responsiveHints()],
};
```

With [Vite](https://vite.dev), in `vite.config.ts`:

```ts
import responsiveHints from "postcss-responsive-hints";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [responsiveHints()],
    },
  },
});
```

With the PostCSS API:

```js
import postcss from "postcss";
import responsiveHints from "postcss-responsive-hints";

const { css } = await postcss([responsiveHints()]).process(input, {
  from: "input.css",
});
```

## How it works

A declaration with responsive hints has one value per breakpoint, separated
by `|`. The values are mobile-first:

- the **first value** is the base value. It stays on the declaration, without a
  media query.
- every **following value** applies from the next breakpoint up, in a
  `min-width` media query.
- `x` skips a breakpoint: the previous value keeps applying.

With the default breakpoints, `480px`, `768px`, `1024px` and `1200px`, the
values map like this:

| `padding: 10px \| 20px \| x \| 30px` | Applies                        |
| ------------------------------------ | ------------------------------ |
| `10px`                               | Always (the base value)        |
| `20px`                               | `(min-width: 768px)`           |
| `x`                                  | Skipped: `20px` keeps applying |
| `30px`                               | `(min-width: 1200px)`          |

So there are as many values as breakpoints, and the first breakpoint (`480px`
by default) only stands for the base value.

The media queries are added **inside** the rule, using
[CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting):

```css
.card {
  padding: 10px | 20px | x | 30px;
  font-size: 14px | 16px | x | 18px;
}
```

becomes:

```css
.card {
  padding: 10px;
  font-size: 14px;
  @media (min-width: 768px) {
    padding: 20px;
    font-size: 16px;
  }
  @media (min-width: 1200px) {
    padding: 30px;
    font-size: 18px;
  }
}
```

Declarations of the same rule share their media queries, and a media query
that the rule already contains is reused:

```css
.card {
  @media (min-width: 768px) {
    border: 1px solid;
  }
  padding: 10px | 20px | x | x;
}
```

becomes:

```css
.card {
  @media (min-width: 768px) {
    border: 1px solid;
    padding: 20px;
  }
  padding: 10px;
}
```

Values with several words (`margin: 0 auto | 10px 20px | x | 0`) and
`!important` (which applies to every value) are supported.

### Where hints can be used

Responsive hints work in style rules, nested rules and rules inside at-rules,
and in `@media`, `@supports`, `@container`, `@layer` and `@scope` nested in a
rule. There, the media queries are added inside the at-rule:

```css
.card {
  @supports (display: grid) {
    gap: 8px | 16px | x | x;
  }
}
```

becomes:

```css
.card {
  @supports (display: grid) {
    gap: 8px;
    @media (min-width: 768px) {
      gap: 16px;
    }
  }
}
```

Anywhere else, e.g. in `@font-face`, `@page` or a keyframe of `@keyframes`, a
media query isn't allowed, so hints there fail the build.

### Browsers without CSS nesting

All current browsers support CSS nesting. To support older ones too, add
[postcss-nested](https://github.com/postcss/postcss-nested), which turns the
nested media queries into top-level ones:

```js
import nested from "postcss-nested";
import responsiveHints from "postcss-responsive-hints";

export default {
  plugins: [responsiveHints(), nested()],
};
```

```css
.card {
  padding: 10px;
}
@media (min-width: 768px) {
  .card {
    padding: 20px;
  }
}
@media (min-width: 1200px) {
  .card {
    padding: 30px;
  }
}
```

## Options

```js
responsiveHints({
  breakpoints: ["0px", "640px", "1024px"],
  comments: true,
});
```

### `breakpoints`

Type: `string[]`. Default: `["480px", "768px", "1024px", "1200px"]`.

The breakpoints, smallest first. Every declaration with hints needs one value
per breakpoint. As the first value is the base value, the first breakpoint is
never used in a media query.

```js
responsiveHints({ breakpoints: ["0px", "600px"] });
```

```css
.card {
  color: red | green;
}
```

becomes:

```css
.card {
  color: red;
  @media (min-width: 600px) {
    color: green;
  }
}
```

### `comments`

Type: `boolean`. Default: `false`.

`padding: 10px | 20px` isn't valid CSS, so editors, linters and other tools
may complain about it. With `comments: true`, the hints can go into a comment
after the base value instead, which keeps the source valid CSS:

```css
.card {
  padding: 10px /* | 20px | x | 30px */;
}
```

The output is the same as with `padding: 10px | 20px | x | 30px`, and the
comment is removed. Hints outside comments keep working.

Only a comment that starts with `|` holds hints. Other comments, like
`color: red /* brand */` or `color: red /* green | blue */`, are left alone,
unless the declaration also has hints: then they're removed together with the
hints.

With `comments: false`, hints in comments are ignored.

## License

[MIT](https://github.com/smashercosmo/postcss-responsive-hints/blob/main/LICENSE)
