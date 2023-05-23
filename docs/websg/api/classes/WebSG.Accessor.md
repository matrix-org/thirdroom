[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Accessor

# Class: Accessor

[WebSG](../modules/WebSG.md).Accessor

The Accessor class provides a way to update a given ArrayBuffer
with new data.

## Table of contents

### Constructors

- [constructor](WebSG.Accessor.md#constructor)

### Properties

- [componentType](WebSG.Accessor.md#componenttype)
- [count](WebSG.Accessor.md#count)
- [dynamic](WebSG.Accessor.md#dynamic)
- [max](WebSG.Accessor.md#max)
- [min](WebSG.Accessor.md#min)
- [normalized](WebSG.Accessor.md#normalized)
- [type](WebSG.Accessor.md#type)

### Methods

- [updateWith](WebSG.Accessor.md#updatewith)

## Constructors

### constructor

• **new Accessor**()

## Properties

### componentType

• **componentType**: [`AccessorComponentType`](../enums/WebSG.AccessorComponentType.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:325](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L325)

___

### count

• **count**: `number`

#### Defined in

[src/engine/scripting/websg-api.d.ts:326](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L326)

___

### dynamic

• **dynamic**: `number`

#### Defined in

[src/engine/scripting/websg-api.d.ts:328](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L328)

___

### max

• `Optional` **max**: `Float32Array`

#### Defined in

[src/engine/scripting/websg-api.d.ts:330](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L330)

___

### min

• `Optional` **min**: `Float32Array`

#### Defined in

[src/engine/scripting/websg-api.d.ts:329](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L329)

___

### normalized

• **normalized**: `number`

#### Defined in

[src/engine/scripting/websg-api.d.ts:327](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L327)

___

### type

• **type**: [`AccessorType`](../enums/WebSG.AccessorType.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:324](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/src/engine/scripting/websg-api.d.ts#L324)

## Methods

### updateWith

▸ **updateWith**(`data`): [`Accessor`](WebSG.Accessor.md)

Updates the existing ArrayBuffer with new data.

**`Example`**

```ts
// Create an instance of Accessor
const accessor = world.createAccessorFrom(buffer, {
 componentType: WebSG.AccessorComponentType.Uint16,
 count: indicesCount,
 type: WebSG.AccessorType.SCALAR,
});

// Update the ArrayBuffer with new data
accessor.updateWith(newData);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `ArrayBuffer` | The new data to update the ArrayBuffer. |

#### Returns

[`Accessor`](WebSG.Accessor.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:96](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L96)
