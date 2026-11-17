import type { PluginCreator } from "postcss";
import type { PluginOptions } from "postcss-responsive-hints";

import postcss, { CssSyntaxError } from "postcss";
import plugin from "postcss-responsive-hints";
import { describe, expect, expectTypeOf, it } from "vitest";

async function run(input: string, options?: PluginOptions) {
  const result = await postcss()
    .use(plugin(options))
    .process(input, { from: undefined });

  return result.css;
}

describe("postcss-responsive-hints", () => {
  describe("plugin creator", () => {
    it("should be a PostCSS plugin creator", () => {
      expect.assertions(2);

      expect(plugin.postcss).toBe(true);
      expect(plugin()).toMatchObject({
        postcssPlugin: "postcss-responsive-hints",
      });
    });

    it("should be typed as a PostCSS plugin creator", () => {
      expect.assertions(0);

      expectTypeOf(plugin).toEqualTypeOf<PluginCreator<PluginOptions>>();
    });

    it("should give the same result when a processor is reused", async () => {
      expect.assertions(1);

      const processor = postcss([plugin()]);
      const input = ".test { color: red | green | blue | pink; }";
      const first = await processor.process(input, { from: undefined });
      const second = await processor.process(input, { from: undefined });

      expect(second.css).toBe(first.css);
    });
  });

  describe("responsive values", () => {
    it("should move every responsive value into its own media query", async () => {
      expect.assertions(1);

      await expect(run(".test { padding: 10px | 20px | x | 30px; }")).resolves
        .toMatchInlineSnapshot(`
        ".test {
            padding: 10px;
            @media (min-width: 768px) {
                padding: 20px }
            @media (min-width: 1200px) {
                padding: 30px } }"
      `);
    });

    it("should keep values that consist of several words", async () => {
      expect.assertions(1);

      await expect(run(".test { margin: 0 auto | 10px 20px | x | 0; }"))
        .resolves.toMatchInlineSnapshot(`
        ".test {
            margin: 0 auto;
            @media (min-width: 768px) {
                margin: 10px 20px }
            @media (min-width: 1200px) {
                margin: 0 } }"
      `);
    });

    it("should keep !important on every value", async () => {
      expect.assertions(1);

      await expect(run(".test { padding: 1px | 2px | x | 4px !important; }"))
        .resolves.toMatchInlineSnapshot(`
        ".test {
            padding: 1px !important;
            @media (min-width: 768px) {
                padding: 2px !important }
            @media (min-width: 1200px) {
                padding: 4px !important } }"
      `);
    });

    it("should leave values without responsive hints alone", async () => {
      expect.assertions(1);

      await expect(
        run(".test { padding: 10px; margin: 0 auto; }"),
      ).resolves.toMatchInlineSnapshot(
        `".test { padding: 10px; margin: 0 auto; }"`,
      );
    });

    it("should ignore | inside strings", async () => {
      expect.assertions(1);

      await expect(
        run(`.test { content: " | "; }`),
      ).resolves.toMatchInlineSnapshot(`".test { content: " | "; }"`);
    });

    it("should ignore | inside parentheses", async () => {
      expect.assertions(1);

      await expect(
        run(".test { background: url(a|b.png); }"),
      ).resolves.toMatchInlineSnapshot(`".test { background: url(a|b.png); }"`);
    });

    it("should split values that contain strings with |", async () => {
      expect.assertions(1);

      await expect(
        run(`.test { content: "a | b" | 'c \\' |' | x | x; }`),
      ).resolves.toMatchInlineSnapshot(
        `
        ".test {
            content: "a | b";
            @media (min-width: 768px) {
                content: 'c \\' |' } }"
      `,
      );
    });

    it("should allow a trailing |", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red /* | green | x | x | */; }", {
          comments: true,
        }),
      ).resolves.toMatchInlineSnapshot(
        `
        ".test {
            color: red;
            @media (min-width: 768px) {
                color: green } }"
      `,
      );
    });
  });

  describe("errors", () => {
    it("should throw when the number of values doesn't match the breakpoints", async () => {
      expect.assertions(2);

      const result = run(".test { padding: 10px | 20px; }");

      await expect(result).rejects.toThrow(CssSyntaxError);
      await expect(result).rejects.toMatchObject({
        column: 9,
        line: 1,
        plugin: "postcss-responsive-hints",
        reason: "Expected 4 responsive values, one per breakpoint, but got 2",
      });
    });

    it("should throw on empty values", async () => {
      expect.assertions(1);

      await expect(run(".test { color: red | | green | x; }")).rejects.toThrow(
        "Responsive values can't be empty. Use `x` to skip a breakpoint",
      );
    });

    it("should throw when the base value is x", async () => {
      expect.assertions(1);

      await expect(run(".test { color: x | green | x | x; }")).rejects.toThrow(
        "The first responsive value is the base value, so it can't be `x`",
      );
    });

    it.each([
      ["@font-face", "@font-face { font-weight: 1 | 2 | 3 | 4; }"],
      ["@page", "@page { margin: 1px | 2px | 3px | 4px; }"],
      ["a keyframe", "@keyframes x { from { opacity: 0 | 1 | x | x; } }"],
    ])("should throw on hints in %s", async (_name, input) => {
      expect.assertions(1);

      await expect(run(input)).rejects.toThrow(
        "Responsive hints can only be used in style rules and in @media, @supports, @container, @layer and @scope",
      );
    });
  });

  describe("rules", () => {
    it("should give every rule its own media queries", async () => {
      expect.assertions(1);

      await expect(
        run(
          ".a { color: red | green | x | x; } .b { color: red | x | blue | x; }",
        ),
      ).resolves.toMatchInlineSnapshot(
        `".a { color: red; @media (min-width: 768px) { color: green } } .b { color: red; @media (min-width: 1024px) { color: blue } }"`,
      );
    });

    it.each(["@supports (display: grid)", "@container card", "@layer base"])(
      "should handle hints in %s nested in a rule",
      async (atRule) => {
        expect.assertions(1);

        const { css } = await postcss([plugin()]).process(
          `.a { ${atRule} { color: red | green | x | x; } }`,
          { from: undefined },
        );

        expect(css).toBe(
          `.a { ${atRule} { color: red; @media (min-width: 768px) { color: green } } }`,
        );
      },
    );

    it("should not merge into other at-rules with the same params", async () => {
      expect.assertions(1);

      await expect(
        run(
          ".a { @container (min-width: 768px) { color: black; } color: red | green | x | x; }",
        ),
      ).resolves.toMatchInlineSnapshot(
        `".a { @container (min-width: 768px) { color: black; } color: red; @media (min-width: 768px) { color: green; } }"`,
      );
    });

    it("should handle rules inside media queries", async () => {
      expect.assertions(1);

      await expect(
        run("@media print { .a { color: red | green | x | x; } }"),
      ).resolves.toMatchInlineSnapshot(
        `"@media print { .a { color: red; @media (min-width: 768px) { color: green } } }"`,
      );
    });

    it("should handle nested rules", async () => {
      expect.assertions(1);

      await expect(
        run(".a { color: red; .b { color: red | green | x | x; } }"),
      ).resolves.toMatchInlineSnapshot(
        `".a { color: red; .b { color: red; @media (min-width: 768px) { color: green } } }"`,
      );
    });

    it("should merge into existing nested media queries", async () => {
      expect.assertions(1);

      await expect(
        run(
          `.content {
  @media (min-width: 768px) {
    color: black;
  }
  color: red /* | x | green */;
}`,
          { breakpoints: ["0px", "768px", "1024px"], comments: true },
        ),
      ).resolves.toMatchInlineSnapshot(`
        ".content {
          @media (min-width: 768px) {
            color: black;
          }
          color: red;
          @media (min-width: 1024px) {
            color: green;
          }
        }"
      `);
    });
  });

  describe("options", () => {
    it("should use custom breakpoints", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red | green; }", {
          breakpoints: ["0px", "600px"],
        }),
      ).resolves.toMatchInlineSnapshot(`
        ".test {
            color: red;
            @media (min-width: 600px) {
                color: green } }"
      `);
    });

    it("should read responsive values from comments", async () => {
      expect.assertions(1);

      await expect(
        run(
          `.content {
  display: flex;
  font-size: 48px /* | 72px | x | 200px */;
  background-color: red /* | green | blue | pink */;
}`,
          { comments: true },
        ),
      ).resolves.toMatchInlineSnapshot(`
        ".content {
          display: flex;
          font-size: 48px;
          background-color: red;
          @media (min-width: 768px) {
            font-size: 72px;
            background-color: green
          }
          @media (min-width: 1024px) {
            background-color: blue
          }
          @media (min-width: 1200px) {
            font-size: 200px;
            background-color: pink
          }
        }"
      `);
    });

    it("should still read responsive values without comments when comments are enabled", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red | green | x | x; }", { comments: true }),
      ).resolves.toMatchInlineSnapshot(`
        ".test {
            color: red;
            @media (min-width: 768px) {
                color: green } }"
      `);
    });

    it("should leave other comments alone when comments are enabled", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red /* brand */; }", { comments: true }),
      ).resolves.toMatchInlineSnapshot(`".test { color: red /* brand */; }"`);
    });

    it("should only read comments that start with |", async () => {
      expect.assertions(2);

      await expect(
        run(".test { color: red /* green | blue */; }", { comments: true }),
      ).resolves.toBe(".test { color: red /* green | blue */; }");
      await expect(
        run(".test { color: red /* brand */ /* | green | x | x */; }", {
          comments: true,
        }),
      ).resolves.toMatchInlineSnapshot(`
        ".test {
            color: red;
            @media (min-width: 768px) {
                color: green } }"
      `);
    });

    it("should read comments with several asterisks", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red /** | green | x | x **/; }", {
          comments: true,
        }),
      ).resolves.toMatchInlineSnapshot(`
        ".test {
            color: red;
            @media (min-width: 768px) {
                color: green } }"
      `);
    });

    it("should ignore hints in comments when comments are disabled", async () => {
      expect.assertions(1);

      await expect(
        run(".test { color: red /* | green | x | x */; }"),
      ).resolves.toMatchInlineSnapshot(
        `".test { color: red /* | green | x | x */; }"`,
      );
    });
  });
});
