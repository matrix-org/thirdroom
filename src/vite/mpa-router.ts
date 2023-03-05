import { Connect, PluginOption } from "vite";
import { glob } from "glob";
import path from "path";
import history, { Rewrite } from "connect-history-api-fallback";

export function mpaRouter(): PluginOption {
  return {
    name: "vite-plugin-mpa-router",
    enforce: "pre",
    async config(config) {
      const pages = await glob("../pages/**/*.html", { cwd: __dirname });

      const input: { [key: string]: string } = {};

      for (const pagePath of pages) {
        const name = path.basename(pagePath, ".html");
        input[name] = path.resolve(__dirname, pagePath);
      }

      config.build = config.build || {};
      config.build.rollupOptions = config.build.rollupOptions || {};
      config.build.rollupOptions.input = input;
    },
    async configureServer(server) {
      const pages = await glob("../pages/**/*.html", { cwd: __dirname });

      const rewrites: Rewrite[] = [];

      for (const pagePath of pages) {
        const name = path.basename(pagePath, ".html");
        const to = `./src/pages/${name}.html`;

        if (name === "index") {
          rewrites.push({
            from: /^\/$/,
            to,
          });
        }

        rewrites.push({
          from: new RegExp(`^/${name}$`),
          to,
        });
      }

      server.middlewares.use(
        history({
          htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
          index: "./src/pages/index.html",
          rewrites,
        }) as Connect.NextHandleFunction
      );
    },
  };
}
