# Vector4

**`Class`**

A 4-dimensional vector.

**Source:** [websg.d.ts:2058](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2058)

## Indexable

\[`index`: `number`\]: `number`

## Constructors

### constructor()

> **new Vector4**(): [`Vector4`](class.Vector4.md)

Constructs a new vector.

**Source:** [websg.d.ts:2095](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2095)

#### Returns

[`Vector4`](class.Vector4.md)

> **new Vector4**(
> x: `number`,
> y: `number`,
> z: `number`,
> w: `number`): [`Vector4`](class.Vector4.md)

Constructs a new vector with the given components.

**Source:** [websg.d.ts:2103](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2103)

#### Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| x         | `number` | The x component of the vector. |
| y         | `number` | The y component of the vector. |
| z         | `number` | The z component of the vector. |
| w         | `number` | The w component of the vector. |

#### Returns

[`Vector4`](class.Vector4.md)

> **new Vector4**(array: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Constructs and sets the initial components of the vector from a numeric array-like object.

**Source:** [websg.d.ts:2107](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2107)

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| array     | `ArrayLike`\<`number`\> |

#### Returns

[`Vector4`](class.Vector4.md)

## Properties

### bottom

> **bottom**: `number`

Alias for [z](class.Vector4.md#z)

**Source:** [websg.d.ts:2087](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2087)

### left

> **left**: `number`

Alias for [w](class.Vector4.md#w)

**Source:** [websg.d.ts:2091](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2091)

### length

> `readonly` **length**: `number`

Returns the number of components in this vector.

**Source:** [websg.d.ts:2187](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2187)

### right

> **right**: `number`

Alias for [y](class.Vector4.md#y)

**Source:** [websg.d.ts:2083](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2083)

### top

> **top**: `number`

Alias for [x](class.Vector4.md#x)

**Source:** [websg.d.ts:2079](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2079)

### w

> **w**: `number`

The w component of the vector.

**Source:** [websg.d.ts:2075](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2075)

### x

> **x**: `number`

The x component of the vector.

**Source:** [websg.d.ts:2063](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2063)

### y

> **y**: `number`

The y component of the vector.

**Source:** [websg.d.ts:2067](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2067)

### z

> **z**: `number`

The z component of the vector.

**Source:** [websg.d.ts:2071](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2071)

## Methods

### add()

> **add**(vector: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Adds a vector to this vector.

**Source:** [websg.d.ts:2122](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2122)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to add. |

#### Returns

[`Vector4`](class.Vector4.md)

### addScaledVector()

> **addScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector4`](class.Vector4.md)

Adds a scaled vector to this vector.

**Source:** [websg.d.ts:2134](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2134)

#### Parameters

| Parameter | Type                    | Description                       |
| :-------- | :---------------------- | :-------------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to add.                |
| scale     | `number`                | The scale to apply to the vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### addVectors()

> **addVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Adds two vectors together and stores the result in this vector.

**Source:** [websg.d.ts:2128](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2128)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### divide()

> **divide**(vector: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Divides this vector by another vector.

**Source:** [websg.d.ts:2172](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2172)

#### Parameters

| Parameter | Type                    | Description              |
| :-------- | :---------------------- | :----------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to divide by. |

#### Returns

[`Vector4`](class.Vector4.md)

### divideScalar()

> **divideScalar**(scalar: `number`): [`Vector4`](class.Vector4.md)

Divides this vector by a scalar value.

**Source:** [websg.d.ts:2183](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2183)

#### Parameters

| Parameter | Type     | Description              |
| :-------- | :------- | :----------------------- |
| scalar    | `number` | The scalar to divide by. |

#### Returns

[`Vector4`](class.Vector4.md)

### divideVectors()

> **divideVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Divides two vectors and stores the result in this vector.

**Source:** [websg.d.ts:2178](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2178)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### multiply()

> **multiply**(vector: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Multiplies this vector by another vector.

**Source:** [websg.d.ts:2156](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2156)

#### Parameters

| Parameter | Type                    | Description             |
| :-------- | :---------------------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to multiply. |

#### Returns

[`Vector4`](class.Vector4.md)

### multiplyScalar()

> **multiplyScalar**(scalar: `number`): [`Vector4`](class.Vector4.md)

Multiplies this vector by a scalar value.

**Source:** [websg.d.ts:2167](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2167)

#### Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| scalar    | `number` | The scalar to multiply by. |

#### Returns

[`Vector4`](class.Vector4.md)

### multiplyVectors()

> **multiplyVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Multiplies two vectors together and stores the result in this vector.

**Source:** [websg.d.ts:2162](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2162)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### set()

> **set**(value: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Sets the components of the vector.

**Source:** [websg.d.ts:2112](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2112)

#### Parameters

| Parameter | Type                    | Description                           |
| :-------- | :---------------------- | :------------------------------------ |
| value     | `ArrayLike`\<`number`\> | The x,y,z,w components of the vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### setScalar()

> **setScalar**(value: `number`): [`Vector4`](class.Vector4.md)

Sets the components of the vector to a scalar value.

**Source:** [websg.d.ts:2117](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2117)

#### Parameters

| Parameter | Type     | Description                         |
| :-------- | :------- | :---------------------------------- |
| value     | `number` | The value to set the components to. |

#### Returns

[`Vector4`](class.Vector4.md)

### subtract()

> **subtract**(vector: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Subtracts a vector from this vector.

**Source:** [websg.d.ts:2139](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2139)

#### Parameters

| Parameter | Type                    | Description             |
| :-------- | :---------------------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract. |

#### Returns

[`Vector4`](class.Vector4.md)

### subtractScaledVector()

> **subtractScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector4`](class.Vector4.md)

Subtracts a scaled vector from this vector.

**Source:** [websg.d.ts:2151](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2151)

#### Parameters

| Parameter | Type                    | Description                       |
| :-------- | :---------------------- | :-------------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract.           |
| scale     | `number`                | The scale to apply to the vector. |

#### Returns

[`Vector4`](class.Vector4.md)

### subtractVectors()

> **subtractVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector4`](class.Vector4.md)

Subtracts two vectors and stores the result in this vector.

**Source:** [websg.d.ts:2145](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2145)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector4`](class.Vector4.md)
