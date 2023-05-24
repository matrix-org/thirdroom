# MeshPrimitive

**`Class`**

The MeshPrimitive class represents a single primitive of a mesh.

**Source:** [websg.d.ts:534](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L534)

## Constructors

### constructor()

> **new MeshPrimitive**(): [`MeshPrimitive`](class.MeshPrimitive.md)

#### Returns

[`MeshPrimitive`](class.MeshPrimitive.md)

## Accessors

### indices

> get **indices()**: `undefined` \| [`Accessor`](class.Accessor.md)

**Source:** [websg.d.ts:543](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L543)

### material

> get **material()**: `undefined` \| [`Material`](class.Material.md)

**Source:** [websg.d.ts:555](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L555) [websg.d.ts:561](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L561)

### mode

> get **mode()**: [`MeshPrimitiveMode`](../variables/variable.MeshPrimitiveMode-1.md)

**Source:** [websg.d.ts:538](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L538)

## Methods

### getAttribute()

> **getAttribute**(name: [`MeshPrimitiveAttribute`](../variables/variable.MeshPrimitiveAttribute-1.md)): `undefined` \| [`Accessor`](class.Accessor.md)

Returns the Accessor for the specified attribute name.

**Source:** [websg.d.ts:550](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L550)

#### Parameters

| Parameter | Type                                                                          | Description         |
| :-------- | :---------------------------------------------------------------------------- | :------------------ |
| name      | [`MeshPrimitiveAttribute`](../variables/variable.MeshPrimitiveAttribute-1.md) | The attribute name. |

#### Returns

`undefined` \| [`Accessor`](class.Accessor.md)

The Accessor for the attribute or undefined if not found.

### setDrawRange()

> **setDrawRange**(start: `number`, count: `number`): [`MeshPrimitive`](class.MeshPrimitive.md)

Sets the draw range for the mesh primitive.

**Source:** [websg.d.ts:568](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L568)

#### Parameters

| Parameter | Type     | Description                              |
| :-------- | :------- | :--------------------------------------- |
| start     | `number` | The starting index for the draw range.   |
| count     | `number` | The number of indices in the draw range. |

#### Returns

[`MeshPrimitive`](class.MeshPrimitive.md)

### thirdroomSetHologramMaterialEnabled()

> **thirdroomSetHologramMaterialEnabled**(enabled: `boolean`): [`MeshPrimitive`](class.MeshPrimitive.md)

Enables or disables the hologram material for the mesh primitive.

**Source:** [websg.d.ts:575](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L575)

#### Parameters

| Parameter | Type      | Description                                                                                                                         |
| :-------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| enabled   | `boolean` | Whether to enable or disable the hologram material.<br /> This API is experimental and may change or be removed in future releases. |

#### Returns

[`MeshPrimitive`](class.MeshPrimitive.md)
