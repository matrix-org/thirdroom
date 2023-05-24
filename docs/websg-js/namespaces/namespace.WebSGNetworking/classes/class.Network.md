# Network

**`Class`**

Represents the networking methods available
for sending and receiving data in a WebSG script.

**Source:** [websg.d.ts:2545](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2545)

## Constructors

### constructor()

> **new Network**(): [`Network`](class.Network.md)

#### Returns

[`Network`](class.Network.md)

## Properties

### onpeerentered

> **onpeerentered**: `null` \| (peer: [`Peer`](class.Peer.md)) => `any`

Callback for when a peer enters the world.

#### Param

The peer that entered the world.

**Source:** [websg.d.ts:2576](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2576)

### onpeerexited

> **onpeerexited**: `null` \| (peer: [`Peer`](class.Peer.md)) => `any`

Callback for when a peer exits the world.

#### Param

The peer that exited the world.

**Source:** [websg.d.ts:2582](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2582)

## Accessors

### host

> get **host()**: `undefined` \| [`Peer`](class.Peer.md)

**Source:** [websg.d.ts:2550](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2550)

### local

> get **local()**: `undefined` \| [`Peer`](class.Peer.md)

**Source:** [websg.d.ts:2556](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2556)

## Methods

### broadcast()

> **broadcast**(message: `string` \| `ArrayBuffer`, reliable?: `boolean`): `undefined`

Broadcasts data to all connected clients.

**Source:** [websg.d.ts:2570](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2570)

#### Parameters

| Parameter | Type                      | Description                                                                           |
| :-------- | :------------------------ | :------------------------------------------------------------------------------------ |
| message   | `string` \| `ArrayBuffer` | -                                                                                     |
| reliable? | `boolean`                 | Whether or not the data should be sent reliably or unreliably.<br />Defaults to true. |

#### Returns

`undefined`

### listen()

> **listen**(): [`NetworkListener`](class.NetworkListener.md)

Creates a new $[NetworkListener](class.NetworkListener.md) that can be used to listen for
incoming messages from other peers.

**Source:** [websg.d.ts:2562](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2562)

#### Returns

[`NetworkListener`](class.NetworkListener.md)
