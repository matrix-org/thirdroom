# Vector3

**`Class`**

A 3-dimensional vector.

**Source:** [websg.d.ts:1949](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1949)

## Indexable

\[`index`: `number`\]: `number`

## Constructors

### constructor()

> **new Vector3**(): [`Vector3`](class.Vector3.md)

**Source:** [websg.d.ts:1963](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1963)

#### Returns

[`Vector3`](class.Vector3.md)

> **new Vector3**(
> x: `number`,
> y: `number`,
> z: `number`): [`Vector3`](class.Vector3.md)

Constructs and sets the initial components of the vector.

**Source:** [websg.d.ts:1970](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1970)

#### Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| x         | `number` | The x component of the vector. |
| y         | `number` | The y component of the vector. |
| z         | `number` | The z component of the vector. |

#### Returns

[`Vector3`](class.Vector3.md)

> **new Vector3**(array: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Constructs and sets the initial components of the vector from a numeric array-like object.

**Source:** [websg.d.ts:1974](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1974)

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| array     | `ArrayLike`\<`number`\> |

#### Returns

[`Vector3`](class.Vector3.md)

## Properties

### length

> `readonly` **length**: `number`

Returns the number of components in this vector.

**Source:** [websg.d.ts:2052](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2052)

### x

> **x**: `number`

The x component of the vector.

**Source:** [websg.d.ts:1954](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1954)

### y

> **y**: `number`

The y component of the vector.

**Source:** [websg.d.ts:1958](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1958)

### z

> **z**: `number`

The z component of the vector.

**Source:** [websg.d.ts:1962](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1962)

## Methods

### add()

> **add**(vector: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Adds the given vector to this vector.

**Source:** [websg.d.ts:1989](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1989)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to add. |

#### Returns

[`Vector3`](class.Vector3.md)

### addScaledVector()

> **addScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector3`](class.Vector3.md)

Adds the given vector scaled by the given scalar to this vector.

**Source:** [websg.d.ts:1999](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1999)

#### Parameters

| Parameter | Type                    |
| :-------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> |
| scale     | `number`                |

#### Returns

[`Vector3`](class.Vector3.md)

### addVectors()

> **addVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Adds two vectors together and stores the result in this vector.

**Source:** [websg.d.ts:1995](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1995)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector3`](class.Vector3.md)

### divide()

> **divide**(vector: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Divides this vector by the given vector.

**Source:** [websg.d.ts:2037](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2037)

#### Parameters

| Parameter | Type                    | Description              |
| :-------- | :---------------------- | :----------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to divide by. |

#### Returns

[`Vector3`](class.Vector3.md)

### divideScalar()

> **divideScalar**(scalar: `number`): [`Vector3`](class.Vector3.md)

Divides this vector by the given scalar.

**Source:** [websg.d.ts:2048](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2048)

#### Parameters

| Parameter | Type     | Description              |
| :-------- | :------- | :----------------------- |
| scalar    | `number` | The scalar to divide by. |

#### Returns

[`Vector3`](class.Vector3.md)

### divideVectors()

> **divideVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Divides the first vector by the second and stores the result in this vector.

**Source:** [websg.d.ts:2043](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2043)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector3`](class.Vector3.md)

### multiply()

> **multiply**(vector: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Multiplies this vector by the given vector.

**Source:** [websg.d.ts:2021](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2021)

#### Parameters

| Parameter | Type                    | Description                |
| :-------- | :---------------------- | :------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to multiply by. |

#### Returns

[`Vector3`](class.Vector3.md)

### multiplyScalar()

> **multiplyScalar**(scalar: `number`): [`Vector3`](class.Vector3.md)

Multiplies this vector by the given scalar.

**Source:** [websg.d.ts:2032](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2032)

#### Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| scalar    | `number` | The scalar to multiply by. |

#### Returns

[`Vector3`](class.Vector3.md)

### multiplyVectors()

> **multiplyVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Multiplies two vectors together and stores the result in this vector.

**Source:** [websg.d.ts:2027](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2027)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector3`](class.Vector3.md)

### set()

> **set**(value: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Sets the components of the vector.

**Source:** [websg.d.ts:1979](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1979)

#### Parameters

| Parameter | Type                    | Description                         |
| :-------- | :---------------------- | :---------------------------------- |
| value     | `ArrayLike`\<`number`\> | The x,y,z components of the vector. |

#### Returns

[`Vector3`](class.Vector3.md)

### setScalar()

> **setScalar**(value: `number`): [`Vector3`](class.Vector3.md)

Sets the components of the vector to the given scalar value.

**Source:** [websg.d.ts:1984](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1984)

#### Parameters

| Parameter | Type     | Description              |
| :-------- | :------- | :----------------------- |
| value     | `number` | The scalar value to set. |

#### Returns

[`Vector3`](class.Vector3.md)

### subtract()

> **subtract**(vector: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Subtracts the given vector from this vector.

**Source:** [websg.d.ts:2004](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2004)

#### Parameters

| Parameter | Type                    | Description             |
| :-------- | :---------------------- | :---------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract. |

#### Returns

[`Vector3`](class.Vector3.md)

### subtractScaledVector()

> **subtractScaledVector**(vector: `ArrayLike`\<`number`\>, scale: `number`): [`Vector3`](class.Vector3.md)

Subtracts the given vector scaled by the given scalar from this vector.

**Source:** [websg.d.ts:2016](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2016)

#### Parameters

| Parameter | Type                    | Description                                           |
| :-------- | :---------------------- | :---------------------------------------------------- |
| vector    | `ArrayLike`\<`number`\> | The vector to subtract.                               |
| scale     | `number`                | The scalar to scale the vector by before subtracting. |

#### Returns

[`Vector3`](class.Vector3.md)

### subtractVectors()

> **subtractVectors**(a: `ArrayLike`\<`number`\>, b: `ArrayLike`\<`number`\>): [`Vector3`](class.Vector3.md)

Subtracts the second vector from the first and stores the result in this vector.

**Source:** [websg.d.ts:2010](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2010)

#### Parameters

| Parameter | Type                    | Description        |
| :-------- | :---------------------- | :----------------- |
| a         | `ArrayLike`\<`number`\> | The first vector.  |
| b         | `ArrayLike`\<`number`\> | The second vector. |

#### Returns

[`Vector3`](class.Vector3.md)
