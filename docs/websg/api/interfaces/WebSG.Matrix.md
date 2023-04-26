[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / Matrix

# Interface: Matrix

[WebSG](../modules/WebSG.md).Matrix

## Table of contents

### Methods

- [listen](WebSG.Matrix.md#listen)
- [receive](WebSG.Matrix.md#receive)
- [send](WebSG.Matrix.md#send)

## Methods

### listen

▸ **listen**(): `void`

#### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:534](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L534)

___

### receive

▸ **receive**(): [`InboundMatrixEvent`](WebSG.InboundMatrixEvent.md)

#### Returns

[`InboundMatrixEvent`](WebSG.InboundMatrixEvent.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:537](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L537)

___

### send

▸ **send**(`event`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`OutboundMatrixEvent`](WebSG.OutboundMatrixEvent.md) |

#### Returns

`any`

#### Defined in

[src/engine/scripting/websg-api.d.ts:536](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L536)
