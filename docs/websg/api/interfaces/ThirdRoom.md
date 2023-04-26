[websg-types](../README.md) / [Exports](../modules.md) / ThirdRoom

# Interface: ThirdRoom

ThirdRoom interface represents additional functionality for WebSG apps.

## Table of contents

### Methods

- [enableMatrixMaterial](ThirdRoom.md#enablematrixmaterial)
- [getAudioDataSize](ThirdRoom.md#getaudiodatasize)
- [getAudioFrequencyData](ThirdRoom.md#getaudiofrequencydata)
- [getAudioTimeData](ThirdRoom.md#getaudiotimedata)
- [inAR](ThirdRoom.md#inar)

## Methods

### enableMatrixMaterial

▸ **enableMatrixMaterial**(`enabled`): `undefined`

Enables or disables the use of Matrix materials.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `enabled` | `boolean` | Whether to enable or disable Matrix materials. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2104](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2104)

___

### getAudioDataSize

▸ **getAudioDataSize**(): `number`

Gets the size of the audio data buffer.

#### Returns

`number`

- The size of the audio data buffer.

#### Defined in

[packages/websg-types/types/websg.d.ts:2110](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2110)

___

### getAudioFrequencyData

▸ **getAudioFrequencyData**(`data`): `number`

Gets the audio frequency data and fills the provided Float32Array.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Float32Array` | The array to store the audio frequency data. |

#### Returns

`number`

- The number of elements filled in the data array.

#### Defined in

[packages/websg-types/types/websg.d.ts:2124](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2124)

___

### getAudioTimeData

▸ **getAudioTimeData**(`data`): `number`

Gets the audio time data and fills the provided Float32Array.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Float32Array` | The array to store the audio time data. |

#### Returns

`number`

- The number of elements filled in the data array.

#### Defined in

[packages/websg-types/types/websg.d.ts:2117](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2117)

___

### inAR

▸ **inAR**(): `boolean`

Determines if the app is running in an Augmented Reality (AR) environment.

#### Returns

`boolean`

- True if the app is running in an AR environment, false otherwise.

#### Defined in

[packages/websg-types/types/websg.d.ts:2130](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2130)
