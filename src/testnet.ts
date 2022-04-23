import WebSocket, { WebSocketServer } from "ws";

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

const host = "localhost";
const port = 8080;
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
    // inform host of new peerId
    peerHost?.send(JSON.stringify({ addPeerId: peerId }));
    // inform existing peers of new peerId
    for (const peerIdA in peers) {
      const peer = peers[peerIdA];
      // no need to send peerId to itself
      if (peer === ws) continue;
      ws.send(JSON.stringify({ addPeerId: peerIdA }));

      const informed = informedPeerIds.get(peerId);
      informed.add(peerIdA);
    }
  }

  ws.on("close", (ws) => {
    console.log("closed connection", peerId);
    connections--;
    if (connections === 0) peerHost = undefined;
    delete peers[peerId];
    informedPeerIds.delete(peerId);
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

console.log(`websocket server started at ws://${host}:${port}`);
