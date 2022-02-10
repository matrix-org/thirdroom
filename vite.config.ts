import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcssPresetEnv from 'postcss-preset-env';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({
          stage: 3,
          browsers: 'last 2 versions',
          features: {
            'nesting-rules': true,
            'custom-media-queries': true,
            'custom-selectors': true,
            'custom-properties': false,
          },
          autoprefixer: true,
        }),
      ],
    }
  }
})
