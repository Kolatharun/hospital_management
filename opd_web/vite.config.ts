import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: process.env.VITE_BASE || './',
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
