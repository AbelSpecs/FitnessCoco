import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tanstackRouter(), react(), tailwindcss()],
  resolve: {
    alias: {
      // Esto arregla los errores de "@/" que veías antes
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Puerto estándar que usa Lovable para que no haya conflictos
    port: 8080,
    host: true,
  },
});
