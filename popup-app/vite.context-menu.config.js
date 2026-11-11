import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith("md-"),
      },
    },
  })],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "../extension/popup-dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(appDirectory, "src/context-menu-main.js"),
      name: "EduarteContextMenu",
      formats: ["iife"],
      fileName: () => "context-menu.js",
      cssFileName: "context-menu",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "context-menu[extname]",
      },
    },
  },
});
