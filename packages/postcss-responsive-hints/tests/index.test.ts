import postcss from "postcss";
import { describe, it } from "vitest";

import plugin from "../src";

describe("apply", () => {
  it("should properly apply and remove custom property sets", async () => {
    const input = `
.content {
  height: 200px;
  width: 100%;
  display: flex;
  
  @media (min-width: 1000px) {
    .hello {
      background-color: red /* | black | white | pink | */;
    }
  }
  
  align-items: center;
  justify-content: center;
  font-size: 48px /* | 72px | x | 200px | */;
  background-color: red /* | green | blue | pink | */;
}

@media (min-width: 768px) {
  .content {
    font-weight: bold;
  }
}
`;
    const result = await postcss()
      .use(plugin({ comments: true }))
      .process(input, { from: undefined });

    // expect(result.css).toBe(expected);

    // oxlint-disable-next-line no-console
    console.log(result.css);
  });
});
