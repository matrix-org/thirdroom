import chokidar from "chokidar";
import { build, preview } from "vite";
import { WebSocket, WebSocketServer } from "ws";

const buildConfig = {
  root: __dirname,
  build: {
    minify: false,
  },
  preview: {
    open: true,
    port: 3000,
  },
};

await build(buildConfig);

const previewServer = await preview(buildConfig);

previewServer.httpServer.prependListener("request", (_req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
});

let sockets: WebSocket[] = [];

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

const debounce = (callback: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      clearTimeout(timeout);
      callback(...args);
    }, wait);
  };
};

async function rebuild() {
  try {
    await build(buildConfig);

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
