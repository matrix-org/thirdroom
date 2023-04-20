[websg-types](../README.md) / [Exports](../modules.md) / WebSGNetworking

# Interface: WebSGNetworking

WebSGNetworking interface represents the networking methods available
for sending and receiving data in a WebSG app.

## Table of contents

### Methods

- [broadcast](WebSGNetworking.md#broadcast)
- [close](WebSGNetworking.md#close)
- [listen](WebSGNetworking.md#listen)
- [receive](WebSGNetworking.md#receive)
- [receiveInto](WebSGNetworking.md#receiveinto)

## Methods

### broadcast

▸ **broadcast**(`data`): `undefined`

Broadcasts data to all connected clients.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `ArrayBuffer` | The data to be broadcasted. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2071](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2071)

___

### close

▸ **close**(): `undefined`

Closes the current network connections.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2064](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2064)

___

### listen

▸ **listen**(): `undefined`

Starts listening for incoming network connections.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2058](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2058)

___

### receive

▸ **receive**(): `undefined` \| `ArrayBuffer`

Receives data from the network. Returns the received data as an ArrayBuffer.
If no data is available, returns undefined.

#### Returns

`undefined` \| `ArrayBuffer`

- The received data or undefined if no data is available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2078](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2078)

___

### receiveInto

▸ **receiveInto**(`buffer`): `number`

Receives data from the network and writes it into the specified buffer.
Returns the number of bytes received and written to the buffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `buffer` | `ArrayBuffer` | The buffer to write the received data into. |

#### Returns

`number`

- The number of bytes received and written to the buffer.

#### Defined in

[packages/websg-types/types/websg.d.ts:2086](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2086)
