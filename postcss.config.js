const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    postcssPresetEnv({
      stage: 1,
      browsers: 'last 2 versions',
      autoprefixer: true,
    })
  ]
};