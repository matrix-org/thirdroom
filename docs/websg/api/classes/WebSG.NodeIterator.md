[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / NodeIterator

# Class: NodeIterator

[WebSG](../modules/WebSG.md).NodeIterator

An iterator for node objects.

## Table of contents

### Constructors

- [constructor](WebSG.NodeIterator.md#constructor)

### Methods

- [[iterator]](WebSG.NodeIterator.md#[iterator])
- [next](WebSG.NodeIterator.md#next)

## Constructors

### constructor

• **new NodeIterator**()

## Methods

### [iterator]

▸ **[iterator]**(): [`NodeIterator`](WebSG.NodeIterator.md)

#### Returns

[`NodeIterator`](WebSG.NodeIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:631](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L631)

___

### next

▸ **next**(): `Object`

Returns the next node in the iterator.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `done` | `boolean` |
| `value` | [`Node`](WebSG.Node.md) |

#### Defined in

[packages/websg-types/types/websg.d.ts:630](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L630)
