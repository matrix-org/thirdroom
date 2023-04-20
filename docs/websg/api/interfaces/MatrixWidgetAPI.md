[websg-types](../README.md) / [Exports](../modules.md) / MatrixWidgetAPI

# Interface: MatrixWidgetAPI

MatrixWidgetAPI interface represents the Matrix widget API methods for sending and receiving messages.

## Table of contents

### Methods

- [close](MatrixWidgetAPI.md#close)
- [listen](MatrixWidgetAPI.md#listen)
- [receive](MatrixWidgetAPI.md#receive)
- [send](MatrixWidgetAPI.md#send)

## Methods

### close

▸ **close**(): `undefined`

Closes the Matrix API message listener.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2184](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2184)

___

### listen

▸ **listen**(): `undefined`

Starts listening for Matrix API messages.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2178](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2178)

___

### receive

▸ **receive**(): `undefined` \| [`MatrixAPIMessage`](../modules.md#matrixapimessage)

Receives a Matrix API message. Returns the received message or undefined if no message is available.

#### Returns

`undefined` \| [`MatrixAPIMessage`](../modules.md#matrixapimessage)

- The received Matrix API message or undefined if no message is available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2190](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2190)

___

### send

▸ **send**(`event`): `undefined`

Sends a Matrix API message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | [`MatrixAPIMessage`](../modules.md#matrixapimessage) | The Matrix API message to send. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2197](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L2197)
