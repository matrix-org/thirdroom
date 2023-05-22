[WebSG API](../README.md) / [WebSGNetworking](../modules/WebSGNetworking.md) / Peer

# Class: Peer

[WebSGNetworking](../modules/WebSGNetworking.md).Peer

## Table of contents

### Constructors

- [constructor](WebSGNetworking.Peer.md#constructor)

### Accessors

- [id](WebSGNetworking.Peer.md#id)
- [isHost](WebSGNetworking.Peer.md#ishost)
- [isLocal](WebSGNetworking.Peer.md#islocal)
- [rotation](WebSGNetworking.Peer.md#rotation)
- [translation](WebSGNetworking.Peer.md#translation)

### Methods

- [send](WebSGNetworking.Peer.md#send)

## Constructors

### constructor

• **new Peer**()

## Accessors

### id

• `get` **id**(): `string`

#### Returns

`string`

#### Defined in

[packages/websg-types/types/websg.d.ts:2155](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2155)

___

### isHost

• `get` **isHost**(): `boolean`

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:2156](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2156)

___

### isLocal

• `get` **isLocal**(): `boolean`

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:2157](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2157)

___

### rotation

• `get` **rotation**(): [`Quaternion`](WebSG.Quaternion.md)

#### Returns

[`Quaternion`](WebSG.Quaternion.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2159](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2159)

___

### translation

• `get` **translation**(): [`Vector3`](WebSG.Vector3.md)

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2158](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2158)

## Methods

### send

▸ **send**(`message`, `reliable`): `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` \| `ArrayBuffer` |
| `reliable` | `boolean` |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2160](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2160)
