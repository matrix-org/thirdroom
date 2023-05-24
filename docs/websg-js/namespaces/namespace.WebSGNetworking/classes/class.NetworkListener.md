# NetworkListener

**`Class`**

A listener for receiving network messages. The [receive ](class.NetworkListener.md#receive)
method should be called once per frame to drain the listener's internal message queue. When done with the
listener, the [close ](class.NetworkListener.md#close) method should be called to free
the listener's resources.

**Source:** [websg.d.ts:2526](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2526)

## Constructors

### constructor()

> **new NetworkListener**(): [`NetworkListener`](class.NetworkListener.md)

#### Returns

[`NetworkListener`](class.NetworkListener.md)

## Methods

### close()

> **close**(): `undefined`

Closes the listener and frees its resources.

**Source:** [websg.d.ts:2538](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2538)

#### Returns

`undefined`

### receive()

> **receive**(buffer?: `ArrayBuffer`): [`NetworkMessageIterator`](class.NetworkMessageIterator.md)

This method returns an iterator that can be used to iterate over inbound network messages.

**Source:** [websg.d.ts:2533](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2533)

#### Parameters

| Parameter | Type          | Description                                                                                                                                                                                                       |
| :-------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buffer?   | `ArrayBuffer` | An optional buffer to use when reading network messages.<br />This should be at least the size of the largest network message you intend to receive.<br />If not provided, the buffer will be created internally. |

#### Returns

[`NetworkMessageIterator`](class.NetworkMessageIterator.md)
