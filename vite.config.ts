import { defineConfig, ResolvedConfig, Plugin } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import fs from "fs/promises";
import path from "path";

function generateMatrixWellKnown(homeserverUrl: string): Plugin {
  let config: ResolvedConfig;

  return {
    name: "generate-matrix-well-known",
    apply: "build",
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },
    generateBundle: async () => {
      const dir = path.resolve(config.build.outDir, ".well-known", "matrix");
      const url = new URL(homeserverUrl);

      await fs.mkdir(dir, { recursive: true });

      const serverConfig = {
        "m.server": `${url.host}:8448`,
      };

      await fs.writeFile(
        path.join(dir, "server"),
        JSON.stringify(serverConfig)
      );

      const clientConfig = {
        "m.homeserver": {
          base_url: homeserverUrl,
        },
        "m.identity_server": {
          base_url: homeserverUrl,
        },
      };

      await fs.writeFile(
        path.join(dir, "client"),
        JSON.stringify(clientConfig)
      );
    },
  };
}

const homeserverUrl =
process.env.MATRIX_HOMESERVER_URL || "https://matrix.thirdroom.io";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), generateMatrixWellKnown(homeserverUrl)],
  server: {
    proxy: {
      "/_matrix": homeserverUrl,
    },
  },
  define: {
    "process.env.MATRIX_HOMESERVER_URL": JSON.stringify(homeserverUrl),
  },
});
