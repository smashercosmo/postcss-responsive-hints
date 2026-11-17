# postcss-responsive-hints

## 2.1.0

### Minor Changes

- Responsive hints are read more precisely, and mistakes fail the build instead of producing invalid CSS.

  - Hints work in `@supports`, `@container`, `@layer` and `@scope` nested in a rule, not only in `@media`.
  - A `|` inside a string or parentheses, e.g. `content: " | "` or `url(a|b.png)`, is no longer a separator. Such declarations used to fail the build.
  - With `comments: true`, only a comment that starts with `|` holds hints. Other comments in the value used to be read as part of it.
  - A nested at-rule with the same params as a media query, e.g. `@container (min-width: 768px)`, no longer receives the declarations of that media query.
  - The build fails, instead of writing invalid CSS, for an empty value (`a | | b | c`), `x` as the first value, and hints outside style rules and the at-rules above, e.g. in `@font-face` or a keyframe. An empty value used to be dropped silently, which moved the following values to the wrong breakpoints.
  - The error for a wrong number of values says how many were expected.
  - The plugin no longer imports `node:crypto`, so it also runs in browsers, e.g. in the playground of the new docs site.

### Patch Changes

- Internal refactor, with no change in behavior. Requires Node.js 20 or later, which `engines` now states, as the plugin uses the `v` regular expression flag.

  - The package now includes a README with usage examples, and its `package.json` has a description, keywords, license and repository.
  - The options are documented in the type declarations.
  - The documentation has a website, [smashercosmo.github.io/postcss-responsive-hints](https://smashercosmo.github.io/postcss-responsive-hints/), with a playground that runs the plugin in the browser. It's the package's `homepage`, and the README links to it.

## 2.0.6

### Patch Changes

- 5b1857f: improve configure-git-identity.sh script

## 2.0.5

### Patch Changes

- 1d53b10: Get tarballs paths from publish-plan.json

## 2.0.4

### Patch Changes

- fd94cb7: Customize changesets commit messages

## 2.0.3

### Patch Changes

- 0e1b241: dev dependencies updated

## 2.0.2

### Patch Changes

- e1fa045: Simplify release workflow even more

## 2.0.1

### Patch Changes

- be3167b: Simplify release workflow

## 2.0.0

### Major Changes

- fc68766: - Modernize postcss-responsive-hints plugin code
  - Migrate to monorepo project structure
  - BREAKING CHANGE: lowest supported postcss version is now 8
