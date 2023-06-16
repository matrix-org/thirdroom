import type { StorybookConfig } from "@storybook/react-vite";

const EXCLUDED_VITE_PLUGIN = ["vite-plugin-mpa-router", "vite-plugin-service-worker"];

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
  core: {
    builder: "@storybook/builder-vite",
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    return {
      ...config,
      appType: undefined,
      base: "/storybook",
      plugins: config.plugins?.filter((p) => {
        if (p && "name" in p && typeof p.name === "string") {
          const exclude = EXCLUDED_VITE_PLUGIN.includes(p.name);
          return !exclude;
        }
        return true;
      }),
      test: undefined,
    };
  },
};
export default config;
