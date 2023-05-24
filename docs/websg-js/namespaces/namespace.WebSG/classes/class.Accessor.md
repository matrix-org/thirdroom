# Accessor

**`Class`**

The Accessor class provides a way to update a given ArrayBuffer
with new data.

**Source:** [websg.d.ts:76](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L76)

## Constructors

### constructor()

> **new Accessor**(): [`Accessor`](class.Accessor.md)

#### Returns

[`Accessor`](class.Accessor.md)

## Methods

### updateWith()

> **updateWith**(data: `ArrayBuffer`): [`Accessor`](class.Accessor.md)

Updates the existing ArrayBuffer with new data.

#### Example

```ts
// Create an instance of Accessor
const accessor = world.createAccessorFrom(buffer, {
  componentType: WebSG.AccessorComponentType.Uint16,
  count: indicesCount,
  type: WebSG.AccessorType.SCALAR,
});

// Update the ArrayBuffer with new data
accessor.updateWith(newData);
```

**Source:** [websg.d.ts:93](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L93)

#### Parameters

| Parameter | Type          | Description                             |
| :-------- | :------------ | :-------------------------------------- |
| data      | `ArrayBuffer` | The new data to update the ArrayBuffer. |

#### Returns

[`Accessor`](class.Accessor.md)
