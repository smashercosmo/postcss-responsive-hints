import { defineConfig } from "vite";
import postCssResponsiveHints from "postcss-responsive-hints";

export default defineConfig({
  css: {
    postcss: {
      plugins: [postCssResponsiveHints({ comments: true })],
    }
  }
})