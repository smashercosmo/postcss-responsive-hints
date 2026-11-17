---
"postcss-responsive-hints": minor
---

Responsive hints are read more precisely, and mistakes fail the build instead of producing invalid CSS.

- Hints work in `@supports`, `@container`, `@layer` and `@scope` nested in a rule, not only in `@media`.
- A `|` inside a string or parentheses, e.g. `content: " | "` or `url(a|b.png)`, is no longer a separator. Such declarations used to fail the build.
- With `comments: true`, only a comment that starts with `|` holds hints. Other comments in the value used to be read as part of it.
- A nested at-rule with the same params as a media query, e.g. `@container (min-width: 768px)`, no longer receives the declarations of that media query.
- The build fails, instead of writing invalid CSS, for an empty value (`a | | b | c`), `x` as the first value, and hints outside style rules and the at-rules above, e.g. in `@font-face` or a keyframe. An empty value used to be dropped silently, which moved the following values to the wrong breakpoints.
- The error for a wrong number of values says how many were expected.
- The plugin no longer imports `node:crypto`, so it also runs in browsers, e.g. in the playground of the new docs site.
