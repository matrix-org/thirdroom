[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / Material

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

[packages/websg-types/types/websg.d.ts:351](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L351)

## Accessors

### baseColorFactor

• `get` **baseColorFactor**(): [`RGBA`](WebSG.RGBA.md)

Returns the base color factor of the Material object as an RGBA instance.

#### Returns

[`RGBA`](WebSG.RGBA.md)

- The base color factor of the Material object.

#### Defined in

[packages/websg-types/types/websg.d.ts:359](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L359)

___

### baseColorTexture

• `get` **baseColorTexture**(): `undefined` \| [`Texture`](WebSG.Texture.md)

Gets the base color texture of the Material object.

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

- The base color texture of the Material object.

#### Defined in

[packages/websg-types/types/websg.d.ts:366](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L366)

• `set` **baseColorTexture**(`texture`): `void`

Sets the base color texture of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `texture` | `undefined` \| [`Texture`](WebSG.Texture.md) | The new base color texture. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:372](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L372)

___

### emissiveFactor

• `get` **emissiveFactor**(): [`RGB`](WebSG.RGB.md)

Returns the emissive factor of the Material object as an RGB instance.

#### Returns

[`RGB`](WebSG.RGB.md)

- The emissive factor of the Material object.

#### Defined in

[packages/websg-types/types/websg.d.ts:406](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L406)

___

### metallicFactor

• `get` **metallicFactor**(): `number`

Gets the metallic factor of the Material object.

#### Returns

`number`

- The metallic factor of the Material object.

#### Defined in

[packages/websg-types/types/websg.d.ts:379](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L379)

• `set` **metallicFactor**(`value`): `void`

Sets the metallic factor of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new metallic factor value. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:385](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L385)

___

### roughnessFactor

• `get` **roughnessFactor**(): `number`

Gets the roughness factor of the Material object.

#### Returns

`number`

- The roughness factor of the Material object.

#### Defined in

[packages/websg-types/types/websg.d.ts:392](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L392)

• `set` **roughnessFactor**(`value`): `void`

Sets the roughness factor of the Material object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The new roughness factor value. |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:398](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L398)

## Methods

### getBaseColorTexture

▸ **getBaseColorTexture**(): `undefined` \| [`Texture`](WebSG.Texture.md)

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:490](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L490)

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

[src/engine/scripting/websg-api.d.ts:491](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L491)
