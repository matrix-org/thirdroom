[Exports](../modules.md) / [WebSG](../modules/websg) / UnlitMaterialProps

# Interface: UnlitMaterialProps

[WebSG](../modules/WebSG.md).UnlitMaterialProps

UnlitMaterialProps is an interface that defines the properties for creating an unlit Material instance.
UnlitMaterialProps

## Table of contents

### Properties

- [alphaCutoff](WebSG.UnlitMaterialProps.md#alphacutoff)
- [alphaMode](WebSG.UnlitMaterialProps.md#alphamode)
- [baseColorFactor](WebSG.UnlitMaterialProps.md#basecolorfactor)
- [baseColorTexture](WebSG.UnlitMaterialProps.md#basecolortexture)
- [doubleSided](WebSG.UnlitMaterialProps.md#doublesided)
- [name](WebSG.UnlitMaterialProps.md#name)

## Properties

### alphaCutoff

• `Optional` **alphaCutoff**: `number`

The optional alpha cutoff value for the material. Default is 0.5.

#### Defined in

[packages/websg-types/types/websg.d.ts:302](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L302)

---

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The optional alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:303](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L303)

---

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The optional RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:299](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L299)

---

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:300](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L300)

---

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:301](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L301)

---

### name

• `Optional` **name**: `string`

The optional name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:298](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L298)
