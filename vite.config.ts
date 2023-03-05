import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import postcssPresetEnv from "postcss-preset-env";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";
import { serviceWorkerPlugin } from "@gautemo/vite-plugin-service-worker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

import testnetServerPlugin from "./src/testnet";
import { mpaRouter } from "./src/vite/mpa-router";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    hmr: false,
  },
  plugins: [
    mpaRouter(),
    react(),
    crossOriginIsolation(),
    testnetServerPlugin(),
    serviceWorkerPlugin({
      filename: "sw.ts",
    }),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, "node_modules/@webxr-input-profiles/assets/dist/**/*"),
          dest: "webxr-input-profiles",
        },
        {
          src: path.resolve(__dirname, "node_modules/detect-gpu/dist/benchmarks/*"),
          dest: "detect-gpu-benchmarks",
        },
      ],
    }),
  ],
  resolve: {
    dedupe: ["three", "bitecs"],
  },
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          stage: 1,
          browsers: "last 2 versions",
        }),
      ],
    },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  build: {
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
    includeSource: ["src/**/*.{ts,tsx}"],
    coverage: {
      all: true,
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
