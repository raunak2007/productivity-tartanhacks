import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        landing: resolve(__dirname, "pages/landing.html"),
        dashboard: resolve(__dirname, "pages/dashboard.html"),
      },
    },
  },
  server: {
    open: "/pages/landing.html",
  },
});
