import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "normalize-zod-documentation-comments",
      // Zod 4.6's prose mentions PURE annotations; Rollup mistakes that prose for actual annotations.
      transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/node_modules/zod/")) return;
        return code
          .replace(/\/\*\* Anchors[\s\S]*?\*\//g, (comment) =>
            comment.replaceAll("@__PURE__", "pure"),
          )
          .replace(/\/\/ Wrapped in a[^\n]*/g, (comment) =>
            comment.replaceAll("@__PURE__", "pure"),
          );
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll("\\", "/");
          if (
            /\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              normalized,
            )
          )
            return "react-vendor";
          if (normalized.includes("/node_modules/zod/")) return "validation";
          if (/\/node_modules\/(i18next|react-i18next)\//.test(normalized))
            return "i18n-vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    execArgv:
      Number(process.versions.node.split(".")[0]) >= 25
        ? ["--no-experimental-webstorage"]
        : [],
  },
});
