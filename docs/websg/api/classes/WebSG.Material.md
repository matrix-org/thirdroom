[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Material

# Class: Material

[WebSG](../modules/WebSG.md).Material

The Material class represents a material in a scene.

## Table of contents

### Constructors

- [constructor](WebSG.Material.md#constructor)

### Accessors

- [baseColorFactor](WebSG.Material.md#basecolorfactor)
- [baseColorTexture](WebSG.Material.md#basecolortexture)
- [emissiveFactor](WebSG.Material.md#emissivefactor)
- [metallicFactor](WebSG.Material.md#metallicfactor)
- [roughnessFactor](WebSG.Material.md#roughnessfactor)

### Methods

- [getBaseColorTexture](WebSG.Material.md#getbasecolortexture)
- [setBaseColorTexture](WebSG.Material.md#setbasecolortexture)

## Constructors

### constructor

• **new Material**(`props`)

Creates a new Material instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`MaterialProps`](../interfaces/WebSG.MaterialProps.md) | The properties to create the material with. |

#### Defined in

[packages/websg-types/types/websg.d.ts:417](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L417)

## Accessors

### baseColorFactor

• `get` **baseColorFactor**(): [`RGBA`](WebSG.RGBA.md)

Returns the base color factor of the Material object as an RGBA instance.

#### Returns

[`RGBA`](WebSG.RGBA.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:422](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L422)

___

### baseColorTexture

• `get` **baseColorTexture**(): `undefined` \| [`Texture`](WebSG.Texture.md)

Gets the base color texture of the Material object.

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:427](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L427)

• `set` **baseColorTexture**(`texture`): `void`

Sets the base color texture of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `texture` | `undefined` \| [`Texture`](WebSG.Texture.md) | The new base color texture. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:433](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L433)

___

### emissiveFactor

• `get` **emissiveFactor**(): [`RGB`](WebSG.RGB.md)

Returns the emissive factor of the Material object as an RGB instance.

#### Returns

[`RGB`](WebSG.RGB.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:460](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L460)

___

### metallicFactor

• `get` **metallicFactor**(): `number`

Gets the metallic factor of the Material object.

#### Returns

`number`

#### Defined in

[packages/websg-types/types/websg.d.ts:438](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L438)

• `set` **metallicFactor**(`value`): `void`

Sets the metallic factor of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new metallic factor value. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:444](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L444)

___

### roughnessFactor

• `get` **roughnessFactor**(): `number`

Gets the roughness factor of the Material object.

#### Returns

`number`

#### Defined in

[packages/websg-types/types/websg.d.ts:449](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L449)

• `set` **roughnessFactor**(`value`): `void`

Sets the roughness factor of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new roughness factor value. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:455](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L455)

## Methods

### getBaseColorTexture

▸ **getBaseColorTexture**(): `undefined` \| [`Texture`](WebSG.Texture.md)

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:490](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L490)

___

### setBaseColorTexture

▸ **setBaseColorTexture**(`texture`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `texture` | `undefined` \| [`Texture`](WebSG.Texture.md) |

#### Returns

`any`

#### Defined in

[src/engine/scripting/websg-api.d.ts:491](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L491)
