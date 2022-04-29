import { WebSocket, WebSocketServer } from "ws";
import { Plugin } from "vite";

function generateUUID() {
  let d = new Date().getTime();
  let d2 = performance.now() * 1000;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function initTestnetServer() {
  const host = "localhost";
  const port = 9090;
  const wss = new WebSocketServer({ host, port });

  let connections = 0;
  let peerHost: WebSocket | undefined;
  const peers: { [key: string]: WebSocket } = {};
  const peerIds = new Map();
  const informedPeerIds = new Map();

  wss.on("connection", (ws) => {
    connections++;

    ws.binaryType = "arraybuffer";

    const peerId = generateUUID();
    peers[peerId] = ws;
    peerIds.set(ws, peerId);
    informedPeerIds.set(peerId, new Set());

    console.log("new client", peerId);

    if (connections === 1) {
      ws.send("setHost");
      console.log("setHost", peerId);
      peerHost = ws;
    }

    ws.send(JSON.stringify({ setPeerId: peerId }));

    if (connections > 1) {
      // inform existing peers of new peerId
      const informed = informedPeerIds.get(peerId);
      for (const peerIdA in peers) {
        const alreadyInformed = informedPeerIds.get(peerId)?.has(peerIdA);
        if (alreadyInformed) continue;

        // no need to send peerId to itself
        if (peerId === peerIdA) continue;

        ws.send(JSON.stringify({ addPeerId: peerIdA }));
        peers[peerIdA].send(JSON.stringify({ addPeerId: peerId }));
        informed.add(peerIdA);

        console.log("informed", peerId, "and", peerIdA, "of one another");
      }
    }

    ws.on("close", () => {
      console.log("closed connection", peerId);
      connections--;
      if (connections === 0) peerHost = undefined;
      delete peers[peerId];
      informedPeerIds.delete(peerId);
      if (ws === peerHost) {
        console.log("host changed to", peerId);
        peerHost = peers[Object.keys(peers)[0]];
      }
    });

    ws.on("message", (data, isBinary) => {
      // console.log("new msg", data, isBinary);
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: isBinary });
        }
      });
    });
  });

  console.log(`Testnet websocket server started at ws://${host}:${port}`);
}

export default function TestnetServerPlugin(): Plugin {
  return {
    name: "testnet-server",
    configureServer() {
      if (process.env.VITE_USE_TESTNET) {
        initTestnetServer();
      }
    },
  };
}
