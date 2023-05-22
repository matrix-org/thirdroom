[WebSG API](../README.md) / [WebSGNetworking](../modules/WebSGNetworking.md) / Network

# Class: Network

[WebSGNetworking](../modules/WebSGNetworking.md).Network

Represents the networking methods available
for sending and receiving data in a WebSG app.

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

#### Defined in

[packages/websg-types/types/websg.d.ts:2195](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2195)

___

### onpeerexited

• **onpeerexited**: ``null`` \| (`peer`: [`Peer`](WebSGNetworking.Peer.md)) => `any`

#### Defined in

[packages/websg-types/types/websg.d.ts:2196](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2196)

## Accessors

### host

• `get` **host**(): `undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Returns

`undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2185](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2185)

___

### local

• `get` **local**(): `undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Returns

`undefined` \| [`Peer`](WebSGNetworking.Peer.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2186](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2186)

## Methods

### broadcast

▸ **broadcast**(`message`, `reliable`): `undefined`

Broadcasts data to all connected clients.

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` \| `ArrayBuffer` |
| `reliable` | `boolean` |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2194](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2194)

___

### listen

▸ **listen**(): [`NetworkListener`](WebSGNetworking.NetworkListener.md)

#### Returns

[`NetworkListener`](WebSGNetworking.NetworkListener.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2187](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2187)
