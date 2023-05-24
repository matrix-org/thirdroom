# Quaternion

**`Class`**

A Quaternion class with x, y, z, and w components. The class provides methods to set the components of the quaternion using an array-like syntax.

**Source:** [websg.d.ts:979](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L979)

## Indexable

\[`n`: `number`\]: `number`

## Constructors

### constructor()

> **new Quaternion**(): [`Quaternion`](class.Quaternion.md)

#### Returns

[`Quaternion`](class.Quaternion.md)

## Properties

### length

> `readonly` **length**: `number`

The number of components in the quaternion.

**Source:** [websg.d.ts:1014](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1014)

### w

> **w**: `number`

The w-component of the quaternion.

**Source:** [websg.d.ts:1003](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1003)

### x

> **x**: `number`

The x-component of the quaternion.

**Source:** [websg.d.ts:988](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L988)

### y

> **y**: `number`

The y-component of the quaternion.

**Source:** [websg.d.ts:993](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L993)

### z

> **z**: `number`

The z-component of the quaternion.

**Source:** [websg.d.ts:998](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L998)

## Methods

### set()

> **set**(value: `ArrayLike`\<`number`\>): [`Quaternion`](class.Quaternion.md)

Sets the quaternion components to the given values.

**Source:** [websg.d.ts:1009](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1009)

#### Parameters

| Parameter | Type                    | Description                                                |
| :-------- | :---------------------- | :--------------------------------------------------------- |
| value     | `ArrayLike`\<`number`\> | An array-like object containing the quaternion components. |

#### Returns

[`Quaternion`](class.Quaternion.md)
