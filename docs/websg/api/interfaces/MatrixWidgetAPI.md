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

[packages/websg-types/types/websg.d.ts:2764](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2764)

___

### listen

▸ **listen**(): `undefined`

Starts listening for Matrix API messages.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2758](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2758)

___

### receive

▸ **receive**(): `undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

Receives a Matrix API message. Returns the received message or undefined if no message is available.

#### Returns

`undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

- The received Matrix API message or undefined if no message is available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2770](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2770)

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

[packages/websg-types/types/websg.d.ts:2777](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2777)
