import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["879e84f8c67c.ngrok-free.app","20edd27da997.ngrok-free.app","98af8a197059.ngrok-free.app","https://video-calling-dhd0.onrender.com]"],
    port: 5173,
  },
});
