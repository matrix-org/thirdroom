[WebSG API](../README.md) / [WebSGNetworking](../modules/WebSGNetworking.md) / NetworkListener

# Class: NetworkListener

[WebSGNetworking](../modules/WebSGNetworking.md).NetworkListener

A listener for receiving network messages. The [receive ](WebSGNetworking.NetworkListener.md#receive)
method should be called once per frame to drain the listener's internal message queue. When done with the
listener, the [close ](WebSGNetworking.NetworkListener.md#close) method should be called to free
the listener's resources.

## Table of contents

### Constructors

- [constructor](WebSGNetworking.NetworkListener.md#constructor)

### Methods

- [close](WebSGNetworking.NetworkListener.md#close)
- [receive](WebSGNetworking.NetworkListener.md#receive)

## Constructors

### constructor

• **new NetworkListener**()

## Methods

### close

▸ **close**(): `undefined`

Closes the listener and frees its resources.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2546](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2546)

___

### receive

▸ **receive**(`buffer?`): [`NetworkMessageIterator`](WebSGNetworking.NetworkMessageIterator.md)

This method returns an iterator that can be used to iterate over inbound network messages.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `buffer?` | `ArrayBuffer` | An optional buffer to use when reading network messages. This should be at least the size of the largest network message you intend to receive. If not provided, the buffer will be created internally. |

#### Returns

[`NetworkMessageIterator`](WebSGNetworking.NetworkMessageIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2541](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2541)
