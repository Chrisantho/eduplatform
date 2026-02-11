import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      path: "/vite-hmr",
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: false,
        cookieDomainRewrite: "",
      },
      "/uploads": {
        target: "http://localhost:8080",
        changeOrigin: false,
      },
    },
  },
});
