import { Connect, PluginOption } from "vite";
import history from "connect-history-api-fallback";

export function mpaRouter(): PluginOption {
  return {
    name: "vite-plugin-mpa-router",
    async configureServer(server) {
      server.middlewares.use(
        history({
          htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
          index: "./index.html",
          rewrites: [
            {
              from: /^\/logviewer$/,
              to: "./logviewer/index.html",
            },
            {
              from: /^\/$/,
              to: "./index.html",
            },
          ],
        }) as Connect.NextHandleFunction
      );
    },
  };
}
