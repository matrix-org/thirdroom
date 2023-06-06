# Networking

The WebSG Networking API gives you access to low latency messaging between peers in a world. Third Room's
networking is built on top of WebRTC data channels. It is peer-to-peer, so messages are sent directly between
peers without going through a server.

A host is a peer connected to the world which can be given additional responsibilities for controlling
certain objects in the world. The host may change over time, for example if the current host leaves the
world or if the host is disconnected from the network.

## Broadcasting messages

The `network.broadcast` function sends a message to all peers in the world. The message can be a string,
a binary buffer. The message can be sent reliably or unreliably. Reliable messages are guaranteed to be
delivered in order, but may be delayed if the network is congested. Unreliable messages may be dropped
or delivered out of order, but can be a useful tool for sending things like positions where you want the lowest
latency and don't care as much about receiving every message.

```js
// Send a string message to all peers in the world
network.broadcast("Hello World");

// Send a binary message to all peers in the world
const buffer = new ArrayBuffer(4);
const view = new Float32Array(buffer);
view[0] = 1.0;
network.broadcast(buffer);

// Send a unreliable message to all peers in the world
network.broadcast("Hello World?", false);
```

## Tracking Peers

To send a message to a specific peer or get properties such as their position and rotation you'll need to
keep track of their peer object. The `network.local` property is the local peer which will be set before
`world.onenter` is called. The `network.host` property is the current host peer which may change over time.

`network.onpeerentered` and `network.onpeerexited` are called any time a peer enters or exits the world and
you can use to store your own map of peers.

```js
network.local; // The local peer

network.host; // The current host peer

network.onpeerentered = (peer) => {
  // Called any time a peer enters the world
};

network.onpeerexited = (peer) => {
  // Called any time a peer exits the world
};
```

## Sending messages to a specific peer

The `peer.send` function sends a message to a specific peer. The message can be a string, a binary buffer, just like the `network.broadcast` method.

```js
// Send a string message to the peer
peer.send(`Hey ${peer.id}`);

// Send a binary message to the peer
const buffer = new ArrayBuffer(4);
const view = new Float32Array(buffer);
view[0] = 1.0;
peer.send(buffer);

// Send a unreliable message to the peer
peer.send(`Hey ${peer.id}`, false);
```

## Peer Transforms

You can use the readonly peer `translation` and `rotation` properties to get the root transform of the peer.
These properties update every frame.

```js
peer.translation; // WebSG.Vector3
peer.rotation; // WebSG.Quaternion
```

## Receiving Messages

To listen for network messages you can create a NetworkListener with `network.listen()`.

```js
// Create a new network listener
const networkListener = network.listen();

// Iterate over all messages received since the last call to .receive()
for (const message of networkListener.receive()) {
  message.peer; // The peer that sent the message
  message.data; // The message data, either a string or an ArrayBuffer
  message.isBinary; // True if the message is a binary ArrayBuffer
}

// Dispose of the network listener and associated resources if you no longer need it
networkListener.close();
```

To reduce memory allocations you can pass a buffer into `.receive()` to write message data into.

```js
const buffer = new ArrayBuffer(1024);
const networkListener = network.listen();

for (const message of networkListener.receive(buffer)) {
  message.peer; // The peer that sent the message
  message.data; // The message data, either a string or an ArrayBuffer
  message.isBinary; // True if the message is a binary ArrayBuffer
  message.bytesWritten; // The number of bytes written into the buffer
}
```
