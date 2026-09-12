import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Bouwt de Eduarte Tools popup (Vue 3 + Material 3 Expressive) naar ../popup-dist
// zodat de extensie de statische output kan laden zonder build-stap.
export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: "../popup-dist",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
