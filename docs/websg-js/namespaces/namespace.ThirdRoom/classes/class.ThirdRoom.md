# ThirdRoom

**`Class`**

**Source:** [websg.d.ts:2651](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2651)

## Constructors

### constructor()

> **new ThirdRoom**(): [`ThirdRoom`](class.ThirdRoom.md)

#### Returns

[`ThirdRoom`](class.ThirdRoom.md)

## Accessors

### actionBar

> get **actionBar()**: [`ActionBar`](class.ActionBar.md)

**Source:** [websg.d.ts:2696](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2696)

## Methods

### enableMatrixMaterial()

> **enableMatrixMaterial**(enabled: `boolean`): `undefined`

Enables or disables the use of the custom Matrix-style material on the world.

Note that this is not a standard function and could be removed or disabled in the future.

**Source:** [websg.d.ts:2659](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2659)

#### Parameters

| Parameter | Type      | Description                                    |
| :-------- | :-------- | :--------------------------------------------- |
| enabled   | `boolean` | Whether to enable or disable Matrix materials. |

#### Returns

`undefined`

### getAudioDataSize()

> **getAudioDataSize**(): `number`

Gets the size of the local audio input source's audio data buffer.
Similar to the WebAudio [AnalyserNode.frequencyBinCount](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount)

**Source:** [websg.d.ts:2666](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2666)

#### Returns

`number`

- The size of the audio data buffer.

### getAudioFrequencyData()

> **getAudioFrequencyData**(data: `Float32Array`): `number`

Gets the local audio input source's frequency data and fills the provided Uint8Array.
The data array must be at least the size returned by getAudioDataSize.
Similar to the WebAudio [AnalyserNode.getByteFrequencyData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData)

**Source:** [websg.d.ts:2684](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2684)

#### Parameters

| Parameter | Type           | Description                                  |
| :-------- | :------------- | :------------------------------------------- |
| data      | `Float32Array` | The array to store the audio frequency data. |

#### Returns

`number`

- The number of elements filled in the data array.

### getAudioTimeData()

> **getAudioTimeData**(data: `Float32Array`): `number`

Gets the local audio input source's time data and fills the provided Uint8Array.
The data array must be at least the size returned by getAudioDataSize.
Similar to the WebAudio [AnalyserNode.getByteTimeDomainData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData)

**Source:** [websg.d.ts:2675](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2675)

#### Parameters

| Parameter | Type           | Description                             |
| :-------- | :------------- | :-------------------------------------- |
| data      | `Float32Array` | The array to store the audio time data. |

#### Returns

`number`

- The number of elements filled in the data array.

### inAR()

> **inAR**(): `boolean`

Determines if the local user is currently in an Augmented Reality (AR) environment.
Checks to see if the local user is in immersive AR mode and if the world supports AR.

**Source:** [websg.d.ts:2691](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2691)

#### Returns

`boolean`

- True if the script is running in an AR environment, false otherwise.
