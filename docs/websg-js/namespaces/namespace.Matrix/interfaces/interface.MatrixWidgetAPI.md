# MatrixWidgetAPI

**`Interface`**

MatrixWidgetAPI interface represents the Matrix widget API methods for sending and receiving messages.

**Source:** [websg.d.ts:2735](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2735)

## Methods

### close()

> **close**(): `undefined`

Closes the Matrix API message listener.

**Source:** [websg.d.ts:2746](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2746)

#### Returns

`undefined`

### listen()

> **listen**(): `undefined`

Starts listening for Matrix API messages.

**Source:** [websg.d.ts:2740](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2740)

#### Returns

`undefined`

### receive()

> **receive**(): `undefined` \| [`MatrixAPIMessage`](../type-aliases/type-alias.MatrixAPIMessage.md)

Receives a Matrix API message. Returns the received message or undefined if no message is available.

**Source:** [websg.d.ts:2752](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2752)

#### Returns

`undefined` \| [`MatrixAPIMessage`](../type-aliases/type-alias.MatrixAPIMessage.md)

- The received Matrix API message or undefined if no message is available.

### send()

> **send**(event: [`MatrixAPIMessage`](../type-aliases/type-alias.MatrixAPIMessage.md)): `undefined`

Sends a Matrix API message.

**Source:** [websg.d.ts:2759](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2759)

#### Parameters

| Parameter | Type                                                                 | Description                     |
| :-------- | :------------------------------------------------------------------- | :------------------------------ |
| event     | [`MatrixAPIMessage`](../type-aliases/type-alias.MatrixAPIMessage.md) | The Matrix API message to send. |

#### Returns

`undefined`
