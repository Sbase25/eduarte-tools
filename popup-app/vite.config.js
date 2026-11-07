import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Bouwt de Eduarte Tools popup (Vue 3 + Material 3 Expressive) naar ../popup-dist
// zodat de extensie de statische output kan laden zonder build-stap.
const appDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith("md-"),
      },
    },
  })],
  base: "./",
  build: {
    outDir: "../popup-dist",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        index: resolve(appDirectory, "index.html"),
        packs: resolve(appDirectory, "packs.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
