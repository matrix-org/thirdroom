[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / MaterialProps

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

[packages/websg-types/types/websg.d.ts:336](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L336)

___

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The optional alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:337](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L337)

___

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The optional RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:338](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L338)

___

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:339](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L339)

___

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:335](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L335)

___

### emissiveFactor

• `Optional` **emissiveFactor**: `ArrayLike`<`number`\>

The optional RGB emissive factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:347](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L347)

___

### emissiveTexture

• `Optional` **emissiveTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional emissive texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:348](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L348)

___

### metallicFactor

• `Optional` **metallicFactor**: `number`

The optional metallic factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:340](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L340)

___

### metallicRoughnessTexture

• `Optional` **metallicRoughnessTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional metallic-roughness texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:342](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L342)

___

### name

• `Optional` **name**: `string`

The optional name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:334](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L334)

___

### normalScale

• `Optional` **normalScale**: `number`

The optional scale for the normal texture. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:344](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L344)

___

### normalTexture

• `Optional` **normalTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional normal texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:343](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L343)

___

### occlusionStrength

• `Optional` **occlusionStrength**: `number`

The optional occlusion strength. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:346](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L346)

___

### occlusionTexture

• `Optional` **occlusionTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional occlusion texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:345](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L345)

___

### roughnessFactor

• `Optional` **roughnessFactor**: `number`

The optional roughness factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:341](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L341)
