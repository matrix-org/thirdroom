[WebSG API](../README.md) / MatrixWidgetAPI

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

[packages/websg-types/types/websg.d.ts:2324](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2324)

___

### listen

▸ **listen**(): `undefined`

Starts listening for Matrix API messages.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2318](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2318)

___

### receive

▸ **receive**(): `undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

Receives a Matrix API message. Returns the received message or undefined if no message is available.

#### Returns

`undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

- The received Matrix API message or undefined if no message is available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2330](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2330)

___

### send

▸ **send**(`event`): `undefined`

Sends a Matrix API message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | [`MatrixAPIMessage`](../README.md#matrixapimessage) | The Matrix API message to send. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2337](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L2337)
