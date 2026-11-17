# postcss-responsive-hints

A [PostCSS](https://postcss.org) plugin for writing responsive values inline:

```css
.card {
  padding: 10px | 20px | x | 30px;
}
```

becomes a base value plus one `min-width` media query per breakpoint:

```css
.card {
  padding: 10px;
  @media (min-width: 768px) {
    padding: 20px;
  }
  @media (min-width: 1200px) {
    padding: 30px;
  }
}
```

**See the [docs site](https://smashercosmo.github.io/postcss-responsive-hints/), with a playground, or the
[package README](./packages/postcss-responsive-hints/README.md) for
installation, usage and options.**

## Repository

| Path                                                                       | Contents                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| [`packages/postcss-responsive-hints`](./packages/postcss-responsive-hints) | The plugin, published to npm                     |
| [`apps/example`](./apps/example)                                           | A Vite app that uses the plugin from the source  |
| [`apps/docs`](./apps/docs)                                                 | The docs site, built with Astro, on GitHub Pages |

## License

[MIT](./LICENSE)
