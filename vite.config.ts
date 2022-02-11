import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import postcssMixin from 'postcss-mixins';
import postcssExtend from 'postcss-extend';
import postcssUtilities from 'postcss-utilities';
import postcssNested from 'postcss-nested';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssImport(),
        postcssUtilities({ centerMethod: 'flexbox' }),
        postcssMixin(),
        // postcssExtend(), FIXME: Not working in nested rules
        postcssNested(),
        postcssPresetEnv({
          stage: 3,
          browsers: 'last 2 versions',
          features: {
            'custom-media-queries': true,
            'custom-selectors': true,
            'custom-properties': true,
          },
          autoprefixer: true,
        }),
      ],
    }
  }
})
