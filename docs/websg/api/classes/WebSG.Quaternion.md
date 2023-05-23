[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Quaternion

# Class: Quaternion

[WebSG](../modules/WebSG.md).Quaternion

A Quaternion class with x, y, z, and w components. The class provides methods to set the components of the quaternion using an array-like syntax.

## Indexable

▪ [n: `number`]: `number`

## Table of contents

### Constructors

- [constructor](WebSG.Quaternion.md#constructor)

### Properties

- [length](WebSG.Quaternion.md#length)
- [w](WebSG.Quaternion.md#w)
- [x](WebSG.Quaternion.md#x)
- [y](WebSG.Quaternion.md#y)
- [z](WebSG.Quaternion.md#z)

### Methods

- [set](WebSG.Quaternion.md#set)

## Constructors

### constructor

• **new Quaternion**()

## Properties

### length

• `Readonly` **length**: `number`

The number of components in the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:1017](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L1017)

___

### w

• **w**: `number`

The w-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:1006](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L1006)

___

### x

• **x**: `number`

The x-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:991](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L991)

___

### y

• **y**: `number`

The y-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:996](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L996)

___

### z

• **z**: `number`

The z-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:1001](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L1001)

## Methods

### set

▸ **set**(`value`): [`Quaternion`](WebSG.Quaternion.md)

Sets the quaternion components to the given values.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `ArrayLike`<`number`\> | An array-like object containing the quaternion components. |

#### Returns

[`Quaternion`](WebSG.Quaternion.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1012](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L1012)
