import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import postcssPresetEnv from "postcss-preset-env";
import crossOriginIsolation from "vite-plugin-cross-origin-isolation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolation()],
  resolve: {
    dedupe: [
      "three",
      "bitecs",
    ],
  },
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          stage: 1,
          browsers: "last 2 versions",
          autoprefixer: true,
        }) as any // postcss-preset-env type definitions are out of date
      ]
    }
  }
})
