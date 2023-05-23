[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Vector2

# Class: Vector2

[WebSG](../modules/WebSG.md).Vector2

A 2-dimensional vector.

## Indexable

▪ [index: `number`]: `number`

## Table of contents

### Constructors

- [constructor](WebSG.Vector2.md#constructor)

### Properties

- [length](WebSG.Vector2.md#length)
- [x](WebSG.Vector2.md#x)
- [y](WebSG.Vector2.md#y)

### Methods

- [add](WebSG.Vector2.md#add)
- [addScaledVector](WebSG.Vector2.md#addscaledvector)
- [addVectors](WebSG.Vector2.md#addvectors)
- [divide](WebSG.Vector2.md#divide)
- [divideScalar](WebSG.Vector2.md#dividescalar)
- [divideVectors](WebSG.Vector2.md#dividevectors)
- [multiply](WebSG.Vector2.md#multiply)
- [multiplyScalar](WebSG.Vector2.md#multiplyscalar)
- [multiplyVectors](WebSG.Vector2.md#multiplyvectors)
- [set](WebSG.Vector2.md#set)
- [setScalar](WebSG.Vector2.md#setscalar)
- [subtract](WebSG.Vector2.md#subtract)
- [subtractScaledVector](WebSG.Vector2.md#subtractscaledvector)
- [subtractVectors](WebSG.Vector2.md#subtractvectors)

## Constructors

### constructor

• **new Vector2**()

Constructs a new vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1859](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1859)

• **new Vector2**(`x`, `y`)

Constructs a new vector with the given components.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | The x component. |
| `y` | `number` | The y component. |

#### Defined in

[packages/websg-types/types/websg.d.ts:1865](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1865)

• **new Vector2**(`array`)

Constructs and sets the initial components of the vector from a numeric array-like object.

#### Parameters

| Name | Type |
| :------ | :------ |
| `array` | `ArrayLike`<`number`\> |

#### Defined in

[packages/websg-types/types/websg.d.ts:1869](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1869)

## Properties

### length

• `Readonly` **length**: `number`

Returns the number of components in this vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1946](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1946)

___

### x

• **x**: `number`

The x component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1851](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1851)

___

### y

• **y**: `number`

The y component of the vector.

#### Defined in

[packages/websg-types/types/websg.d.ts:1855](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1855)

## Methods

### add

▸ **add**(`vector`): [`Vector2`](WebSG.Vector2.md)

Adds the given vector to this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to add. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1883](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1883)

___

### addScaledVector

▸ **addScaledVector**(`vector`, `scale`): [`Vector2`](WebSG.Vector2.md)

Adds the given vector scaled by the given scalar to this vector.

#### Parameters

| Name | Type |
| :------ | :------ |
| `vector` | `ArrayLike`<`number`\> |
| `scale` | `number` |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1893](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1893)

___

### addVectors

▸ **addVectors**(`a`, `b`): [`Vector2`](WebSG.Vector2.md)

Adds the given vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1889](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1889)

___

### divide

▸ **divide**(`vector`): [`Vector2`](WebSG.Vector2.md)

Divides this vector by the given vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to divide by. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1931](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1931)

___

### divideScalar

▸ **divideScalar**(`scalar`): [`Vector2`](WebSG.Vector2.md)

Divides this vector by the given scalar.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to divide by. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1942](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1942)

___

### divideVectors

▸ **divideVectors**(`a`, `b`): [`Vector2`](WebSG.Vector2.md)

Divides the given vectors and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1937](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1937)

___

### multiply

▸ **multiply**(`vector`): [`Vector2`](WebSG.Vector2.md)

Multiplies this vector by the given vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to multiply by. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1915](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1915)

___

### multiplyScalar

▸ **multiplyScalar**(`scalar`): [`Vector2`](WebSG.Vector2.md)

Multiplies this vector by the given scalar.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `scalar` | `number` | The scalar to multiply by. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1926](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1926)

___

### multiplyVectors

▸ **multiplyVectors**(`a`, `b`): [`Vector2`](WebSG.Vector2.md)

Multiplies the given vectors together and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1921](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1921)

___

### set

▸ **set**(`value`): [`Vector2`](WebSG.Vector2.md)

Sets the components of the vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `ArrayLike`<`number`\> | The x,y components of the vector. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1874](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1874)

___

### setScalar

▸ **setScalar**(`value`): [`Vector2`](WebSG.Vector2.md)

Sets the components of the vector to a scalar value.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `number` |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1878](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1878)

___

### subtract

▸ **subtract**(`vector`): [`Vector2`](WebSG.Vector2.md)

Subtracts the given vector from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1898](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1898)

___

### subtractScaledVector

▸ **subtractScaledVector**(`vector`, `scale`): [`Vector2`](WebSG.Vector2.md)

Subtracts the given vector scaled by the given scalar from this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vector` | `ArrayLike`<`number`\> | The vector to subtract. |
| `scale` | `number` | The scalar to scale the vector by. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1910](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1910)

___

### subtractVectors

▸ **subtractVectors**(`a`, `b`): [`Vector2`](WebSG.Vector2.md)

Subtracts the second vector from the first and stores the result in this vector.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `a` | `ArrayLike`<`number`\> | The first vector. |
| `b` | `ArrayLike`<`number`\> | The second vector. |

#### Returns

[`Vector2`](WebSG.Vector2.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1904](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L1904)
