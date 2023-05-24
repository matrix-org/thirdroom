[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / MaterialProps

# Interface: MaterialProps

[WebSG](../modules/WebSG.md).MaterialProps

MaterialProps is an interface that defines the properties for creating a Material instance.

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

The alpha cutoff value for the material. Default is 0.5.

#### Defined in

[packages/websg-types/types/websg.d.ts:358](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L358)

___

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:362](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L362)

___

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:366](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L366)

___

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:370](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L370)

___

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:354](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L354)

___

### emissiveFactor

• `Optional` **emissiveFactor**: `ArrayLike`<`number`\>

The RGB emissive factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:402](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L402)

___

### emissiveTexture

• `Optional` **emissiveTexture**: [`Texture`](../classes/WebSG.Texture.md)

The emissive texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:406](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L406)

___

### metallicFactor

• `Optional` **metallicFactor**: `number`

The metallic factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:374](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L374)

___

### metallicRoughnessTexture

• `Optional` **metallicRoughnessTexture**: [`Texture`](../classes/WebSG.Texture.md)

The metallic-roughness texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:382](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L382)

___

### name

• `Optional` **name**: `string`

The name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:350](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L350)

___

### normalScale

• `Optional` **normalScale**: `number`

The scale for the normal texture. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:390](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L390)

___

### normalTexture

• `Optional` **normalTexture**: [`Texture`](../classes/WebSG.Texture.md)

The normal texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:386](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L386)

___

### occlusionStrength

• `Optional` **occlusionStrength**: `number`

The occlusion strength. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:398](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L398)

___

### occlusionTexture

• `Optional` **occlusionTexture**: [`Texture`](../classes/WebSG.Texture.md)

The occlusion texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:394](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L394)

___

### roughnessFactor

• `Optional` **roughnessFactor**: `number`

The roughness factor. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:378](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L378)
