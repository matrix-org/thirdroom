# Vector2

**`Class`**

A 2-dimensional vector.

**Source:** [websg.d.ts:1843](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1843)

## Indexable

\[`index`: `number`\]: `number`

## Constructors

### constructor()

> **new Vector2**(): [`Vector2`](class.Vector2.md)

Constructs a new vector.

**Source:** [websg.d.ts:1856](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1856)

#### Returns

[`Vector2`](class.Vector2.md)

> **new Vector2**(x: `number`, y: `number`): [`Vector2`](class.Vector2.md)

Constructs a new vector with the given components.

**Source:** [websg.d.ts:1862](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1862)

#### Parameters

| Parameter | Type     | Description      |
| :-------- | :------- | :--------------- |
| x         | `number` | The x component. |
| y         | `number` | The y component. |

#### Returns

[`Vector2`](class.Vector2.md)

> **new Vector2**(array: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Constructs and sets the initial components of the vector from a numeric array-like object.

**Source:** [websg.d.ts:1866](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1866)

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| array     | `ArrayLike`\<`number`\> |

#### Returns

[`Vector2`](class.Vector2.md)

## Properties

### length

> `readonly` **length**: `number`

Returns the number of components in this vector.

**Source:** [websg.d.ts:1943](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1943)

### x

> **x**: `number`

The x component of the vector.

**Source:** [websg.d.ts:1848](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1848)

### y

> **y**: `number`

The y component of the vector.

**Source:** [websg.d.ts:1852](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1852)

## Methods

### add()

> **add**(vector: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Adds the given vector to this vector.

**Source:** [websg.d.ts:1880](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1880)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to add. |

#### Returns

[`Vector2`](class.Vector2.md)

### addScaledVector()

> **addScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector2`](class.Vector2.md)

Adds the given vector scaled by the given scalar to this vector.

**Source:** [websg.d.ts:1890](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1890)

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> |
| scale     | `number`                |

#### Returns

[`Vector2`](class.Vector2.md)

### addVectors()

> **addVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Adds the given vectors together and stores the result in this vector.

**Source:** [websg.d.ts:1886](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1886)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector2`](class.Vector2.md)

### divide()

> **divide**(vector: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Divides this vector by the given vector.

**Source:** [websg.d.ts:1928](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1928)

#### Parameters

| Parameter | Type                    | Description              |
| :-------- | :---------------------- | :----------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to divide by. |

#### Returns

[`Vector2`](class.Vector2.md)

### divideScalar()

> **divideScalar**(scalar: `number`): [`Vector2`](class.Vector2.md)

Divides this vector by the given scalar.

**Source:** [websg.d.ts:1939](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1939)

#### Parameters

| Parameter | Type     | Description              |
| :-------- | :------- | :----------------------- |
| scalar    | `number` | The scalar to divide by. |

#### Returns

[`Vector2`](class.Vector2.md)

### divideVectors()

> **divideVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Divides the given vectors and stores the result in this vector.

**Source:** [websg.d.ts:1934](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1934)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector2`](class.Vector2.md)

### multiply()

> **multiply**(vector: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Multiplies this vector by the given vector.

**Source:** [websg.d.ts:1912](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1912)

#### Parameters

| Parameter | Type                    | Description                |
| :-------- | :---------------------- | :------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to multiply by. |

#### Returns

[`Vector2`](class.Vector2.md)

### multiplyScalar()

> **multiplyScalar**(scalar: `number`): [`Vector2`](class.Vector2.md)

Multiplies this vector by the given scalar.

**Source:** [websg.d.ts:1923](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1923)

#### Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| scalar    | `number` | The scalar to multiply by. |

#### Returns

[`Vector2`](class.Vector2.md)

### multiplyVectors()

> **multiplyVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Multiplies the given vectors together and stores the result in this vector.

**Source:** [websg.d.ts:1918](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1918)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector2`](class.Vector2.md)

### set()

> **set**(value: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Sets the components of the vector.

**Source:** [websg.d.ts:1871](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1871)

#### Parameters

| Parameter | Type                    | Description                       |
| :-------- | :---------------------- | :-------------------------------- |
| value     | `ArrayLike`\<`number`\> | The x,y components of the vector. |

#### Returns

[`Vector2`](class.Vector2.md)

### setScalar()

> **setScalar**(value: `number`): [`Vector2`](class.Vector2.md)

Sets the components of the vector to a scalar value.

**Source:** [websg.d.ts:1875](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1875)

#### Parameters

| Parameter | Type     |
| :-------- | :------- |
| value     | `number` |

#### Returns

[`Vector2`](class.Vector2.md)

### subtract()

> **subtract**(vector: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Subtracts the given vector from this vector.

**Source:** [websg.d.ts:1895](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1895)

#### Parameters

| Parameter | Type                    | Description             |
| :-------- | :---------------------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract. |

#### Returns

[`Vector2`](class.Vector2.md)

### subtractScaledVector()

> **subtractScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector2`](class.Vector2.md)

Subtracts the given vector scaled by the given scalar from this vector.

**Source:** [websg.d.ts:1907](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1907)

#### Parameters

| Parameter | Type                    | Description                        |
| :-------- | :---------------------- | :--------------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract.            |
| scale     | `number`                | The scalar to scale the vector by. |

#### Returns

[`Vector2`](class.Vector2.md)

### subtractVectors()

> **subtractVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector2`](class.Vector2.md)

Subtracts the second vector from the first and stores the result in this vector.

**Source:** [websg.d.ts:1901](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1901)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector2`](class.Vector2.md)
