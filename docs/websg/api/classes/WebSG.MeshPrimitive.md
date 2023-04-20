[Exports](../modules.md) / [WebSG](../modules/websg) / MeshPrimitive

# Class: MeshPrimitive

[WebSG](../modules/WebSG.md).MeshPrimitive

The MeshPrimitive class represents a single primitive of a mesh.

## Table of contents

### Constructors

- [constructor](WebSG.MeshPrimitive.md#constructor)

### Accessors

- [indices](WebSG.MeshPrimitive.md#indices)
- [material](WebSG.MeshPrimitive.md#material)
- [mode](WebSG.MeshPrimitive.md#mode)

### Methods

- [getAttribute](WebSG.MeshPrimitive.md#getattribute)
- [setDrawRange](WebSG.MeshPrimitive.md#setdrawrange)
- [thirdroomSetHologramMaterialEnabled](WebSG.MeshPrimitive.md#thirdroomsethologrammaterialenabled)

## Constructors

### constructor

• **new MeshPrimitive**()

## Accessors

### indices

• `get` **indices**(): `undefined` \| [`Accessor`](WebSG.Accessor.md)

Returns the Accessor for the indices of the mesh primitive.

#### Returns

`undefined` \| [`Accessor`](WebSG.Accessor.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:511](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L511)

---

### material

• `get` **material**(): `undefined` \| [`Material`](WebSG.Material.md)

Returns the Material of the mesh primitive.

#### Returns

`undefined` \| [`Material`](WebSG.Material.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:524](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L524)

• `set` **material**(`material`): `void`

Sets the Material for the mesh primitive.

#### Parameters

| Name       | Type                                           | Description          |
| :--------- | :--------------------------------------------- | :------------------- |
| `material` | `undefined` \| [`Material`](WebSG.Material.md) | The Material to set. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:530](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L530)

---

### mode

• `get` **mode**(): [`MeshPrimitiveMode`](../enums/WebSG.MeshPrimitiveMode.md)

Returns the current rendering mode of the mesh primitive.

#### Returns

[`MeshPrimitiveMode`](../enums/WebSG.MeshPrimitiveMode.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:505](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L505)

## Methods

### getAttribute

▸ **getAttribute**(`name`): `undefined` \| [`Accessor`](WebSG.Accessor.md)

Returns the Accessor for the specified attribute name.

#### Parameters

| Name   | Type                                                                 | Description         |
| :----- | :------------------------------------------------------------------- | :------------------ |
| `name` | [`MeshPrimitiveAttribute`](../enums/WebSG.MeshPrimitiveAttribute.md) | The attribute name. |

#### Returns

`undefined` \| [`Accessor`](WebSG.Accessor.md)

- The Accessor for the attribute or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:518](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L518)

---

### setDrawRange

▸ **setDrawRange**(`start`, `count`): [`MeshPrimitive`](WebSG.MeshPrimitive.md)

Sets the draw range for the mesh primitive.

#### Parameters

| Name    | Type     | Description                              |
| :------ | :------- | :--------------------------------------- |
| `start` | `number` | The starting index for the draw range.   |
| `count` | `number` | The number of indices in the draw range. |

#### Returns

[`MeshPrimitive`](WebSG.MeshPrimitive.md)

- The MeshPrimitive instance.

#### Defined in

[packages/websg-types/types/websg.d.ts:538](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L538)

---

### thirdroomSetHologramMaterialEnabled

▸ **thirdroomSetHologramMaterialEnabled**(`enabled`): [`MeshPrimitive`](WebSG.MeshPrimitive.md)

Enables or disables the hologram material for the mesh primitive.

#### Parameters

| Name      | Type      | Description                                         |
| :-------- | :-------- | :-------------------------------------------------- |
| `enabled` | `boolean` | Whether to enable or disable the hologram material. |

#### Returns

[`MeshPrimitive`](WebSG.MeshPrimitive.md)

- The MeshPrimitive instance.

#### Defined in

[packages/websg-types/types/websg.d.ts:545](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L545)
