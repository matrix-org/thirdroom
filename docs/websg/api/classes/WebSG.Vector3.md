[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Vector3

# Class: Vector3

[WebSG](../modules/WebSG.md).Vector3

A 3-dimensional vector.

## Indexable

▪ [index: `number`]: `number`

## Table of contents

### Constructors

- [constructor](WebSG.Vector3.md#constructor)

### Properties

- [length](WebSG.Vector3.md#length)
- [x](WebSG.Vector3.md#x)
- [y](WebSG.Vector3.md#y)
- [z](WebSG.Vector3.md#z)

### Methods

- [add](WebSG.Vector3.md#add)
- [addScaledVector](WebSG.Vector3.md#addscaledvector)
- [addVectors](WebSG.Vector3.md#addvectors)
- [divide](WebSG.Vector3.md#divide)
- [divideScalar](WebSG.Vector3.md#dividescalar)
- [divideVectors](WebSG.Vector3.md#dividevectors)
- [multiply](WebSG.Vector3.md#multiply)
- [multiplyScalar](WebSG.Vector3.md#multiplyscalar)
- [multiplyVectors](WebSG.Vector3.md#multiplyvectors)
- [set](WebSG.Vector3.md#set)
- [setScalar](WebSG.Vector3.md#setscalar)
- [subtract](WebSG.Vector3.md#subtract)
- [subtractScaledVector](WebSG.Vector3.md#subtractscaledvector)
- [subtractVectors](WebSG.Vector3.md#subtractvectors)

## Constructors

### constructor

• **new Vector3**()

#### Defined in

[packages/websg-types/types/websg.d.ts:1966](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1966)

• **new Vector3**(`x`, `y`, `z`)

Constructs and sets the initial components of the vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | The x component of the vector. |
| `y` | `number` | The y component of the vector. |
| `z` | `number` | The z component of the vector. |

#### Defined in

[packages/websg-types/types/websg.d.ts:1973](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1973)

• **new Vector3**(`array`)

Constructs and sets the initial components of the vector from a numeric array-like object.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `ArrayLike`<`number`\> |

#### Defined in

[packages/websg-types/types/websg.d.ts:1977](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1977)

## Properties

### length

• `Readonly` **length**: `number`

Returns the number of components in this vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2055](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2055)

___

### x

• **x**: `number`

The x component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1957](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1957)

___

### y

• **y**: `number`

The y component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1961](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1961)

___

### z

• **z**: `number`

The z component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1965](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1965)

## Methods

### add

▸ **add**(`vector`): [`Vector3`](WebSG.Vector3.md)

Adds the given vector to this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to add. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1992](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1992)

___

### addScaledVector

▸ **addScaledVector**(`vector`, `scale`): [`Vector3`](WebSG.Vector3.md)

Adds the given vector scaled by the given scalar to this vector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `vector` | `ArrayLike`<`number`\> |
| `scale` | `number` |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2002](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2002)

___

### addVectors

▸ **addVectors**(`a`, `b`): [`Vector3`](WebSG.Vector3.md)

Adds two vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1998](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1998)

___

### divide

▸ **divide**(`vector`): [`Vector3`](WebSG.Vector3.md)

Divides this vector by the given vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to divide by. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2040](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2040)

___

### divideScalar

▸ **divideScalar**(`scalar`): [`Vector3`](WebSG.Vector3.md)

Divides this vector by the given scalar.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to divide by. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2051](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2051)

___

### divideVectors

▸ **divideVectors**(`a`, `b`): [`Vector3`](WebSG.Vector3.md)

Divides the first vector by the second and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2046](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2046)

___

### multiply

▸ **multiply**(`vector`): [`Vector3`](WebSG.Vector3.md)

Multiplies this vector by the given vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to multiply by. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2024](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2024)

___

### multiplyScalar

▸ **multiplyScalar**(`scalar`): [`Vector3`](WebSG.Vector3.md)

Multiplies this vector by the given scalar.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to multiply by. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2035](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2035)

___

### multiplyVectors

▸ **multiplyVectors**(`a`, `b`): [`Vector3`](WebSG.Vector3.md)

Multiplies two vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2030](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2030)

___

### set

▸ **set**(`value`): [`Vector3`](WebSG.Vector3.md)

Sets the components of the vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `ArrayLike`<`number`\> | The x,y,z components of the vector. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1982](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1982)

___

### setScalar

▸ **setScalar**(`value`): [`Vector3`](WebSG.Vector3.md)

Sets the components of the vector to the given scalar value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The scalar value to set. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1987](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1987)

___

### subtract

▸ **subtract**(`vector`): [`Vector3`](WebSG.Vector3.md)

Subtracts the given vector from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2007](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2007)

___

### subtractScaledVector

▸ **subtractScaledVector**(`vector`, `scale`): [`Vector3`](WebSG.Vector3.md)

Subtracts the given vector scaled by the given scalar from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |
| `scale` | `number` | The scalar to scale the vector by before subtracting. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2019](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2019)

___

### subtractVectors

▸ **subtractVectors**(`a`, `b`): [`Vector3`](WebSG.Vector3.md)

Subtracts the second vector from the first and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2013](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2013)
