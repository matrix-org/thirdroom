[WebSG API](../README.md) / [WebSGNetworking](../modules/WebSGNetworking.md) / NetworkMessageIterator

# Class: NetworkMessageIterator

[WebSGNetworking](../modules/WebSGNetworking.md).NetworkMessageIterator

An iterator for [NetworkMessage ](WebSGNetworking.NetworkMessage.md)s.

## Table of contents

### Constructors

- [constructor](WebSGNetworking.NetworkMessageIterator.md#constructor)

### Methods

- [[iterator]](WebSGNetworking.NetworkMessageIterator.md#[iterator])
- [next](WebSGNetworking.NetworkMessageIterator.md#next)

## Constructors

### constructor

• **new NetworkMessageIterator**()

## Methods

### [iterator]

▸ **[iterator]**(): [`NetworkMessageIterator`](WebSGNetworking.NetworkMessageIterator.md)

#### Returns

[`NetworkMessageIterator`](WebSGNetworking.NetworkMessageIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2525](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2525)

___

### next

▸ **next**(): `Object`

Returns the next [NetworkMessage](WebSGNetworking.NetworkMessage.md) in the iterator.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `done` | `boolean` |
| `value` | [`NetworkMessage`](WebSGNetworking.NetworkMessage.md) |

#### Defined in

[packages/websg-types/types/websg.d.ts:2524](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2524)
