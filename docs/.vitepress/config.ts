import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Third Room",
  description: "Documentation for Third Room",
  base: "/docs",
  outDir: "../dist/docs",
  themeConfig: {
    siteTitle: false,
    logo: { light: "/light-logo-full.svg", dark: "/dark-logo-full.svg", alt: "Third Room" },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "User Guide", link: "/get-started" },
      { text: "Developers", link: "/get-started" },
      { text: "Creators", link: "/get-started" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/matrix-org/thirdroom" }],
  },
});
