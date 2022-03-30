import chokidar from "chokidar";
import { build, preview } from "vite";
import config from "./vite.config.js";
import { WebSocketServer } from "ws";

const devServerConfig = {
  ...config,
  mode: "preview",
  build: {
    minify: false,
    sourcemap: true,
  },
  preview: {
    ...config.preview,
    open: true,
    port: 3000,
  },
};

await build(devServerConfig);

const previewServer = await preview(devServerConfig);

previewServer.httpServer.prependListener("request", (_req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
});

let sockets = [];

const wss = new WebSocketServer({ server: previewServer.httpServer });

wss.on("connection", (ws) => {
  ws.addEventListener("close", () => {
    sockets = sockets.filter((s) => s !== ws);
  });
  sockets.push(ws);
});

console.log("\n");

previewServer.printUrls();

console.log("\n");

const debounce = (callback, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      clearTimeout(timeout);
      callback(...args);
    }, wait);
  };
};

async function rebuild() {
  try {
    await build(devServerConfig);

    for (const socket of sockets) {
      socket.send("rebuilt");
    }
  } catch (error) {
    console.log(error);
  }
}

const debouncedRebuild = debounce(rebuild, 500);

chokidar
  .watch(["./src", "index.html"], {
    ignoreInitial: true,
  })
  .on("add", debouncedRebuild)
  .on("change", debouncedRebuild)
  .on("unlink", debouncedRebuild)
  .on("addDir", debouncedRebuild)
  .on("unlinkDir", debouncedRebuild);
