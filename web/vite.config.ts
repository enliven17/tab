import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Static pages: landing, demo, docs, brand kit, and the banner the README image is captured from.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        app: "app/index.html",
        docs: "docs/index.html",
        brand: "brand/index.html",
        banner: "banner/index.html",
      },
    },
  },
});
