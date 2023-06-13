import { defineConfig } from "vitepress";
import { vitepressPluginTypedoc } from "./plugins/vitepress-plugin-typedoc";
import typedocSidebar from "../websg-js/typedoc-sidebar.json";

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
      { text: "Guides", link: "/guides/" },
      {
        text: "Reference",
        items: [
          { text: "WebSG JavaScript API", link: "/websg-js/" },
          { text: "glTF Extensions", link: "/gltf/" },
        ],
      },
    ],
    sidebar: {
      "/guides/": [
        { text: "Getting Started", link: "/guides/" },
        { text: "Creators", link: "/guides/creators" },
        { text: "Developers", link: "/guides/developers" },
        {
          text: "Web Scene Graph",
          items: [
            { text: "Overview", link: "/guides/websg/" },
            {
              text: "Getting Started Tutorial",
              items: [
                { text: "Part 1: Interactables", link: "/guides/websg/basketball/part-1" },
                { text: "Part 2: Collisions and UI", link: "/guides/websg/basketball/part-2" },
                { text: "Part 3: Networking", link: "/guides/websg/basketball/part-3" },
              ],
            },
            { text: "Scene Graph", link: "/guides/websg/scenegraph" },
            { text: "Meshes", link: "/guides/websg/meshes" },
            { text: "Materials", link: "/guides/websg/materials" },
            { text: "Lighting", link: "/guides/websg/lighting" },
            { text: "Physics", link: "/guides/websg/physics" },
            { text: "ECS", link: "/guides/websg/ecs" },
            { text: "Action Bar", link: "/guides/websg/actionbar" },
            { text: "UI", link: "/guides/websg/ui" },
            { text: "Interactables", link: "/guides/websg/interactables" },
            { text: "Networking", link: "/guides/websg/networking" },
          ],
        },
        {
          text: "Unity Exporter",
          items: [
            { text: "Getting Started", link: "/guides/unity/" },
            { text: "Exporter GitHub Repository", link: "https://github.com/matrix-org/thirdroom-unity-exporter" },
          ],
        },
        {
          text: "Self Hosting",
          link: "/guides/self-hosting",
        },
        {
          text: "Community / Support",
          items: [
            {
              text: "Matrix Chat Room",
              link: "https://matrix.to/#/#thirdroom-dev:matrix.org",
            },
            {
              text: "GitHub Discussions",
              link: "https://github.com/matrix-org/thirdroom/discussions",
            },
          ],
        },
      ],
      // TODO: rename api -> websg-js when this issue is resolved:
      // https://github.com/tgreyuk/typedoc-plugin-markdown/issues/438
      "/websg-js/": typedocSidebar as any,
      "/gltf/": [
        { text: "Overview", link: "/gltf/" },
        { text: "MX_background", link: "/gltf/MX_background/README" },
        { text: "MX_character_controller", link: "/gltf/MX_character_controller/README" },
        { text: "MX_lightmap", link: "/gltf/MX_lightmap/README" },
        { text: "MX_postprocessing", link: "/gltf/MX_postprocessing/README" },
        { text: "MX_reflection_probes", link: "/gltf/MX_reflection_probes/README" },
        { text: "MX_scene_ar", link: "/gltf/MX_scene_ar/README" },
        { text: "MX_spawn_point", link: "/gltf/MX_spawn_point/README" },
        { text: "MX_texture_rgbm", link: "/gltf/MX_texture_rgbm/README" },
        { text: "MX_tiles_renderer", link: "/gltf/MX_tiles_renderer/README" },
      ],
    },
    socialLinks: [
      {
        icon: {
          svg: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_2227_5198)"><path d="M0.474231 0.411923V17.5881H1.71V18H0V0H1.71V0.411923H0.474231Z" fill="currentColor"/><path d="M5.75626 5.85691V6.72576H5.7805C6.01242 6.39345 6.2928 6.1373 6.61819 5.9573C6.94357 5.77384 7.32088 5.68384 7.74319 5.68384C8.14819 5.68384 8.51857 5.76345 8.85434 5.91922C9.19011 6.07499 9.4428 6.35538 9.61934 6.74999C9.80973 6.46961 10.0693 6.22038 10.3947 6.00576C10.7201 5.79115 11.1078 5.68384 11.5543 5.68384C11.8936 5.68384 12.2086 5.72538 12.4993 5.80845C12.7901 5.89153 13.0359 6.02307 13.2436 6.20653C13.4513 6.38999 13.6105 6.62538 13.7282 6.91961C13.8424 7.21384 13.9013 7.56692 13.9013 7.9823V12.2781H12.1393V8.63999C12.1393 8.42538 12.1324 8.22115 12.1151 8.03076C12.0978 7.84038 12.0528 7.67422 11.9801 7.53576C11.904 7.39384 11.7966 7.28307 11.6513 7.19999C11.5059 7.11691 11.3086 7.07538 11.0628 7.07538C10.8136 7.07538 10.6128 7.12384 10.4605 7.2173C10.3082 7.31422 10.187 7.43538 10.1005 7.59115C10.014 7.74345 9.95511 7.91653 9.92742 8.11384C9.89973 8.30768 9.88242 8.50499 9.88242 8.7023V12.2781H8.1205V8.67807C8.1205 8.48768 8.11703 8.30076 8.10665 8.11384C8.09973 7.92691 8.06165 7.7573 7.99934 7.59807C7.93703 7.4423 7.83319 7.31422 7.6878 7.22076C7.54242 7.1273 7.33126 7.07884 7.04742 7.07884C6.96434 7.07884 6.85357 7.09615 6.71857 7.13422C6.58357 7.1723 6.44857 7.24153 6.3205 7.34538C6.19242 7.44922 6.08165 7.59807 5.99165 7.79192C5.90165 7.98576 5.85665 8.24191 5.85665 8.55692V12.2815H4.09473V5.85691H5.75626Z" fill="currentColor"/><path d="M17.5258 17.5881V0.411923H16.29V0H18V18H16.29V17.5881H17.5258Z" fill="currentColor"/></g></svg>',
        },
        link: "https://matrix.to/#/#thirdroom-dev:matrix.org",
      },
      { icon: "github", link: "https://github.com/matrix-org/thirdroom" },
      { icon: "mastodon", link: "https://mastodon.matrix.org/@thirdroom" },
      { icon: "twitter", link: "https://twitter.com/thirdroomio" },
    ],
  },
  // vite: {
  //   plugins: [vitepressPluginTypedoc()],
  // },
});
