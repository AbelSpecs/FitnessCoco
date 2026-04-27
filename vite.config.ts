// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
//import { defineConfig } from "@lovable.dev/vite-tanstack-config";

//export default defineConfig();
// En vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// import { lovableTagger } from 'lovable-tagger' // Comenta esto si sigue fallando

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // lovableTagger(), // Comenta esto también
  ],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  // ... resto de la config
});
