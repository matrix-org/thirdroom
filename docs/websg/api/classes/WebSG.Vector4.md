[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Vector4

# Class: Vector4

[WebSG](../modules/WebSG.md).Vector4

A 4-dimensional vector.

## Indexable

▪ [index: `number`]: `number`

## Table of contents

### Constructors

- [constructor](WebSG.Vector4.md#constructor)

### Properties

- [bottom](WebSG.Vector4.md#bottom)
- [left](WebSG.Vector4.md#left)
- [length](WebSG.Vector4.md#length)
- [right](WebSG.Vector4.md#right)
- [top](WebSG.Vector4.md#top)
- [w](WebSG.Vector4.md#w)
- [x](WebSG.Vector4.md#x)
- [y](WebSG.Vector4.md#y)
- [z](WebSG.Vector4.md#z)

### Methods

- [add](WebSG.Vector4.md#add)
- [addScaledVector](WebSG.Vector4.md#addscaledvector)
- [addVectors](WebSG.Vector4.md#addvectors)
- [divide](WebSG.Vector4.md#divide)
- [divideScalar](WebSG.Vector4.md#dividescalar)
- [divideVectors](WebSG.Vector4.md#dividevectors)
- [multiply](WebSG.Vector4.md#multiply)
- [multiplyScalar](WebSG.Vector4.md#multiplyscalar)
- [multiplyVectors](WebSG.Vector4.md#multiplyvectors)
- [set](WebSG.Vector4.md#set)
- [setScalar](WebSG.Vector4.md#setscalar)
- [subtract](WebSG.Vector4.md#subtract)
- [subtractScaledVector](WebSG.Vector4.md#subtractscaledvector)
- [subtractVectors](WebSG.Vector4.md#subtractvectors)

## Constructors

### constructor

• **new Vector4**()

Constructs a new vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2098](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2098)

• **new Vector4**(`x`, `y`, `z`, `w`)

Constructs a new vector with the given components.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | The x component of the vector. |
| `y` | `number` | The y component of the vector. |
| `z` | `number` | The z component of the vector. |
| `w` | `number` | The w component of the vector. |

#### Defined in

[packages/websg-types/types/websg.d.ts:2106](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2106)

• **new Vector4**(`array`)

Constructs and sets the initial components of the vector from a numeric array-like object.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `ArrayLike`<`number`\> |

#### Defined in

[packages/websg-types/types/websg.d.ts:2110](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2110)

## Properties

### bottom

• **bottom**: `number`

Alias for [z](WebSG.Vector4.md#z)

#### Defined in

[packages/websg-types/types/websg.d.ts:2090](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2090)

___

### left

• **left**: `number`

Alias for [w](WebSG.Vector4.md#w)

#### Defined in

[packages/websg-types/types/websg.d.ts:2094](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2094)

___

### length

• `Readonly` **length**: `number`

Returns the number of components in this vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2190](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2190)

___

### right

• **right**: `number`

Alias for [y](WebSG.Vector4.md#y)

#### Defined in

[packages/websg-types/types/websg.d.ts:2086](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2086)

___

### top

• **top**: `number`

Alias for [x](WebSG.Vector4.md#x)

#### Defined in

[packages/websg-types/types/websg.d.ts:2082](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2082)

___

### w

• **w**: `number`

The w component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2078](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2078)

___

### x

• **x**: `number`

The x component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2066](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2066)

___

### y

• **y**: `number`

The y component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2070](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2070)

___

### z

• **z**: `number`

The z component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:2074](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2074)

## Methods

### add

▸ **add**(`vector`): [`Vector4`](WebSG.Vector4.md)

Adds a vector to this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to add. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2125](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2125)

___

### addScaledVector

▸ **addScaledVector**(`vector`, `scale`): [`Vector4`](WebSG.Vector4.md)

Adds a scaled vector to this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to add. |
| `scale` | `number` | The scale to apply to the vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2137](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2137)

___

### addVectors

▸ **addVectors**(`a`, `b`): [`Vector4`](WebSG.Vector4.md)

Adds two vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2131](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2131)

___

### divide

▸ **divide**(`vector`): [`Vector4`](WebSG.Vector4.md)

Divides this vector by another vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to divide by. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2175](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2175)

___

### divideScalar

▸ **divideScalar**(`scalar`): [`Vector4`](WebSG.Vector4.md)

Divides this vector by a scalar value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to divide by. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2186](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2186)

___

### divideVectors

▸ **divideVectors**(`a`, `b`): [`Vector4`](WebSG.Vector4.md)

Divides two vectors and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2181](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2181)

___

### multiply

▸ **multiply**(`vector`): [`Vector4`](WebSG.Vector4.md)

Multiplies this vector by another vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to multiply. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2159](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2159)

___

### multiplyScalar

▸ **multiplyScalar**(`scalar`): [`Vector4`](WebSG.Vector4.md)

Multiplies this vector by a scalar value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to multiply by. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2170](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2170)

___

### multiplyVectors

▸ **multiplyVectors**(`a`, `b`): [`Vector4`](WebSG.Vector4.md)

Multiplies two vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2165](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2165)

___

### set

▸ **set**(`value`): [`Vector4`](WebSG.Vector4.md)

Sets the components of the vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `ArrayLike`<`number`\> | The x,y,z,w components of the vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2115](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2115)

___

### setScalar

▸ **setScalar**(`value`): [`Vector4`](WebSG.Vector4.md)

Sets the components of the vector to a scalar value.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The value to set the components to. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2120](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2120)

___

### subtract

▸ **subtract**(`vector`): [`Vector4`](WebSG.Vector4.md)

Subtracts a vector from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2142](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2142)

___

### subtractScaledVector

▸ **subtractScaledVector**(`vector`, `scale`): [`Vector4`](WebSG.Vector4.md)

Subtracts a scaled vector from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |
| `scale` | `number` | The scale to apply to the vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2154](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2154)

___

### subtractVectors

▸ **subtractVectors**(`a`, `b`): [`Vector4`](WebSG.Vector4.md)

Subtracts two vectors and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector4`](WebSG.Vector4.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2148](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2148)
