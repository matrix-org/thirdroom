import WebSocket, { WebSocketServer } from "ws";

const host = "localhost";
const port = 8080;
const wss = new WebSocketServer({ host, port });

wss.on("connection", (ws) => {
  ws.binaryType = "arraybuffer";
  console.log("new client");
  ws.on("message", (data, isBinary) => {
    console.log("new msg", data, isBinary);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });
});

console.log(`websocket server started at ws://${host}:${port}`);
