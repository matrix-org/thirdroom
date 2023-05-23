[WebSG API](../README.md) / [WebSGNetworking](../modules/WebSGNetworking.md) / Network

# Class: Network

[WebSGNetworking](../modules/WebSGNetworking.md).Network

Represents the networking methods available
for sending and receiving data in a WebSG script.

## Table of contents

### Constructors

- [constructor](WebSGNetworking.Network.md#constructor)

### Properties

- [onpeerentered](WebSGNetworking.Network.md#onpeerentered)
- [onpeerexited](WebSGNetworking.Network.md#onpeerexited)

### Accessors

- [host](WebSGNetworking.Network.md#host)
- [local](WebSGNetworking.Network.md#local)

### Methods

- [broadcast](WebSGNetworking.Network.md#broadcast)
- [listen](WebSGNetworking.Network.md#listen)

## Constructors

### constructor

• **new Network**()

## Properties

### onpeerentered

• **onpeerentered**: ``null`` \| (`peer`: [`Peer`](WebSGNetworking.Peer.md)) => `any`

Callback for when a peer enters the world.

**`Param`**

The peer that entered the world.

#### Defined in

[packages/websg-types/types/websg.d.ts:2583](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2583)

___

### onpeerexited

• **onpeerexited**: ``null`` \| (`peer`: [`Peer`](WebSGNetworking.Peer.md)) => `any`

Callback for when a peer exits the world.

**`Param`**

The peer that exited the world.

#### Defined in

[packages/websg-types/types/websg.d.ts:2589](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2589)

## Accessors

### host

• `get` **host**(): `undefined` \| [`Peer`](WebSGNetworking.Peer.md)

The current host [Peer](WebSGNetworking.Peer.md) in the world. This may change
as peers enter and exit the world.

#### Returns

`undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2558](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2558)

___

### local

• `get` **local**(): `undefined` \| [`Peer`](WebSGNetworking.Peer.md)

The local user's [Peer](WebSGNetworking.Peer.md) in the world. This will not be set
until the user has entered the world and [world.onenter](WebSG.World.md#onenter) is called

#### Returns

`undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2564](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2564)

## Methods

### broadcast

▸ **broadcast**(`message`, `reliable?`): `undefined`

Broadcasts data to all connected clients.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `message` | `string` \| `ArrayBuffer` | `undefined` | - |
| `reliable` | `boolean` | `true` | Whether or not the data should be sent reliably or unreliably. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2577](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2577)

___

### listen

▸ **listen**(): [`NetworkListener`](WebSGNetworking.NetworkListener.md)

Creates a new $[NetworkListener](WebSGNetworking.NetworkListener.md) that can be used to listen for
incoming messages from other peers.

#### Returns

[`NetworkListener`](WebSGNetworking.NetworkListener.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2570](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2570)
