[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / UnlitMaterialProps

# Interface: UnlitMaterialProps

[WebSG](../modules/WebSG.md).UnlitMaterialProps

UnlitMaterialProps is an interface that defines the properties for creating an unlit Material instance.

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

The alpha cutoff value for the material. Default is 0.5.

#### Defined in

[packages/websg-types/types/websg.d.ts:336](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L336)

___

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:340](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L340)

___

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:324](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L324)

___

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:328](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L328)

___

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:332](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L332)

___

### name

• `Optional` **name**: `string`

The name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:320](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L320)
