[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / MaterialProps

# Interface: MaterialProps

[WebSG](../modules/WebSG.md).MaterialProps

MaterialProps is an interface that defines the properties for creating a Material instance.
 MaterialProps

## Table of contents

### Properties

- [alphaCutoff](WebSG.MaterialProps.md#alphacutoff)
- [alphaMode](WebSG.MaterialProps.md#alphamode)
- [baseColorFactor](WebSG.MaterialProps.md#basecolorfactor)
- [baseColorTexture](WebSG.MaterialProps.md#basecolortexture)
- [doubleSided](WebSG.MaterialProps.md#doublesided)
- [emissiveFactor](WebSG.MaterialProps.md#emissivefactor)
- [emissiveTexture](WebSG.MaterialProps.md#emissivetexture)
- [metallicFactor](WebSG.MaterialProps.md#metallicfactor)
- [metallicRoughnessTexture](WebSG.MaterialProps.md#metallicroughnesstexture)
- [name](WebSG.MaterialProps.md#name)
- [normalScale](WebSG.MaterialProps.md#normalscale)
- [normalTexture](WebSG.MaterialProps.md#normaltexture)
- [occlusionStrength](WebSG.MaterialProps.md#occlusionstrength)
- [occlusionTexture](WebSG.MaterialProps.md#occlusiontexture)
- [roughnessFactor](WebSG.MaterialProps.md#roughnessfactor)

## Properties

### alphaCutoff

• `Optional` **alphaCutoff**: `number`

The optional alpha cutoff value for the material. Default is 0.5.

#### Defined in

[packages/websg-types/types/websg.d.ts:328](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L328)

___

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The optional alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:329](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L329)

___

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The optional RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:330](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L330)

___

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:331](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L331)

___

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:327](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L327)

___

### emissiveFactor

• `Optional` **emissiveFactor**: `ArrayLike`<`number`\>

The optional RGB emissive factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:339](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L339)

___

### emissiveTexture

• `Optional` **emissiveTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional emissive texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:340](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L340)

___

### metallicFactor

• `Optional` **metallicFactor**: `number`

The optional metallic factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:332](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L332)

___

### metallicRoughnessTexture

• `Optional` **metallicRoughnessTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional metallic-roughness texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:334](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L334)

___

### name

• `Optional` **name**: `string`

The optional name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:326](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L326)

___

### normalScale

• `Optional` **normalScale**: `number`

The optional scale for the normal texture. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:336](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L336)

___

### normalTexture

• `Optional` **normalTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional normal texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:335](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L335)

___

### occlusionStrength

• `Optional` **occlusionStrength**: `number`

The optional occlusion strength. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:338](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L338)

___

### occlusionTexture

• `Optional` **occlusionTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional occlusion texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:337](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L337)

___

### roughnessFactor

• `Optional` **roughnessFactor**: `number`

The optional roughness factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:333](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L333)
