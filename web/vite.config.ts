import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Three static pages: the landing page, the demo and the brand kit.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { index: "index.html", app: "app/index.html", brand: "brand/index.html" },
    },
  },
});
