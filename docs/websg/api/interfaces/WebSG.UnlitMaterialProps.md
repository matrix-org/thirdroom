[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / UnlitMaterialProps

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

[packages/websg-types/types/websg.d.ts:310](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L310)

___

### alphaMode

• `Optional` **alphaMode**: [`AlphaMode`](../modules/WebSG.md#alphamode-1)

The optional alpha mode for the material. Default is 'OPAQUE'.

#### Defined in

[packages/websg-types/types/websg.d.ts:311](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L311)

___

### baseColorFactor

• `Optional` **baseColorFactor**: `ArrayLike`<`number`\>

The optional RGBA base color factor.

#### Defined in

[packages/websg-types/types/websg.d.ts:307](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L307)

___

### baseColorTexture

• `Optional` **baseColorTexture**: [`Texture`](../classes/WebSG.Texture.md)

The optional base color texture.

#### Defined in

[packages/websg-types/types/websg.d.ts:308](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L308)

___

### doubleSided

• `Optional` **doubleSided**: `boolean`

Whether the material is visible from both sides. Default is false.

#### Defined in

[packages/websg-types/types/websg.d.ts:309](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L309)

___

### name

• `Optional` **name**: `string`

The optional name of the material.

#### Defined in

[packages/websg-types/types/websg.d.ts:306](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L306)
