[Exports](../modules.md) / [WebSG](../modules/websg) / Quaternion

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

[packages/websg-types/types/websg.d.ts:902](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L902)

---

### w

• **w**: `number`

The w-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:888](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L888)

---

### x

• **x**: `number`

The x-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:870](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L870)

---

### y

• **y**: `number`

The y-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:876](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L876)

---

### z

• **z**: `number`

The z-component of the quaternion.

#### Defined in

[packages/websg-types/types/websg.d.ts:882](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L882)

## Methods

### set

▸ **set**(`value`): `undefined`

Sets the quaternion components to the given values.

#### Parameters

| Name    | Type                   | Description                                                |
| :------ | :--------------------- | :--------------------------------------------------------- |
| `value` | `ArrayLike`<`number`\> | An array-like object containing the quaternion components. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:895](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L895)
