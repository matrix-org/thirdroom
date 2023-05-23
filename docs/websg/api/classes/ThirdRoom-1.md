[WebSG API](../README.md) / ThirdRoom

# Class: ThirdRoom

## Table of contents

### Constructors

- [constructor](ThirdRoom-1.md#constructor)

### Accessors

- [actionBar](ThirdRoom-1.md#actionbar)

### Methods

- [enableMatrixMaterial](ThirdRoom-1.md#enablematrixmaterial)
- [getAudioDataSize](ThirdRoom-1.md#getaudiodatasize)
- [getAudioFrequencyData](ThirdRoom-1.md#getaudiofrequencydata)
- [getAudioTimeData](ThirdRoom-1.md#getaudiotimedata)
- [inAR](ThirdRoom-1.md#inar)

## Constructors

### constructor

• **new ThirdRoom**()

## Accessors

### actionBar

• `get` **actionBar**(): [`ActionBar`](ThirdRoom.ActionBar.md)

Returns the [ActionBar](ThirdRoom.ActionBar.md) object.

#### Returns

[`ActionBar`](ThirdRoom.ActionBar.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2709](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2709)

## Methods

### enableMatrixMaterial

▸ **enableMatrixMaterial**(`enabled`): `undefined`

Enables or disables the use of the custom Matrix-style material on the world.

 Note that this is not a standard function and could be removed or disabled in the future.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `enabled` | `boolean` | Whether to enable or disable Matrix materials. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2672](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2672)

___

### getAudioDataSize

▸ **getAudioDataSize**(): `number`

Gets the size of the local audio input source's audio data buffer.
Similar to the WebAudio [AnalyserNode.frequencyBinCount](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount)

#### Returns

`number`

- The size of the audio data buffer.

#### Defined in

[packages/websg-types/types/websg.d.ts:2679](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2679)

___

### getAudioFrequencyData

▸ **getAudioFrequencyData**(`data`): `number`

Gets the local audio input source's frequency data and fills the provided Uint8Array.
The data array must be at least the size returned by [getAudioDataSize](ThirdRoom-1.md#getaudiodatasize).
Similar to the WebAudio [AnalyserNode.getByteFrequencyData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Float32Array` | The array to store the audio frequency data. |

#### Returns

`number`

- The number of elements filled in the data array.

#### Defined in

[packages/websg-types/types/websg.d.ts:2697](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2697)

___

### getAudioTimeData

▸ **getAudioTimeData**(`data`): `number`

Gets the local audio input source's time data and fills the provided Uint8Array.
The data array must be at least the size returned by [getAudioDataSize](ThirdRoom-1.md#getaudiodatasize).
Similar to the WebAudio [AnalyserNode.getByteTimeDomainData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Float32Array` | The array to store the audio time data. |

#### Returns

`number`

- The number of elements filled in the data array.

#### Defined in

[packages/websg-types/types/websg.d.ts:2688](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2688)

___

### inAR

▸ **inAR**(): `boolean`

Determines if the local user is currently in an Augmented Reality (AR) environment.
Checks to see if the local user is in immersive AR mode and if the world supports AR.

#### Returns

`boolean`

- True if the script is running in an AR environment, false otherwise.

#### Defined in

[packages/websg-types/types/websg.d.ts:2704](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2704)
