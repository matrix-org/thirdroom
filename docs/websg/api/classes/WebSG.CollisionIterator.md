[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / CollisionIterator

# Class: CollisionIterator

[WebSG](../modules/WebSG.md).CollisionIterator

An iterator for collisions.

## Table of contents

### Constructors

- [constructor](WebSG.CollisionIterator.md#constructor)

### Methods

- [[iterator]](WebSG.CollisionIterator.md#[iterator])
- [next](WebSG.CollisionIterator.md#next)

## Constructors

### constructor

• **new CollisionIterator**()

## Methods

### [iterator]

▸ **[iterator]**(): [`CollisionIterator`](WebSG.CollisionIterator.md)

#### Returns

[`CollisionIterator`](WebSG.CollisionIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:957](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L957)

___

### next

▸ **next**(): `Object`

Returns the next collision in the iterator.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `done` | `boolean` |
| `value` | [`Collision`](WebSG.Collision.md) |

#### Defined in

[packages/websg-types/types/websg.d.ts:956](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L956)
