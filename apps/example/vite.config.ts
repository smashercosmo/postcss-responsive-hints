import postCssResponsiveHints from "postcss-responsive-hints";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [postCssResponsiveHints({ comments: true })],
    },
  },
});
