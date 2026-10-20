import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/business": {
        target: process.env.BUSINESS_API_TARGET || "http://127.0.0.1:3000",
        changeOrigin: false,
      },
      "/__local": {
        target: process.env.BUSINESS_API_TARGET || "http://127.0.0.1:3000",
        changeOrigin: false,
      },
    },
  },
});
