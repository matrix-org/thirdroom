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

[packages/websg-types/types/websg.d.ts:2763](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2763)

___

### listen

▸ **listen**(): `undefined`

Starts listening for Matrix API messages.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2757](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2757)

___

### receive

▸ **receive**(): `undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

Receives a Matrix API message. Returns the received message or undefined if no message is available.

#### Returns

`undefined` \| [`MatrixAPIMessage`](../README.md#matrixapimessage)

- The received Matrix API message or undefined if no message is available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2769](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2769)

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

[packages/websg-types/types/websg.d.ts:2776](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2776)
