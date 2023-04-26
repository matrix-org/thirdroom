[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / Light

# Class: Light

[WebSG](../modules/WebSG.md).Light

The Light class represents a light source in a scene.

## Table of contents

### Constructors

- [constructor](WebSG.Light.md#constructor)

### Properties

- [intensity](WebSG.Light.md#intensity)

### Accessors

- [color](WebSG.Light.md#color)

## Constructors

### constructor

• **new Light**(`props`)

Creates a new Light instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`LightProps`](../interfaces/WebSG.LightProps.md) | The properties to create the light with. |

#### Defined in

[packages/websg-types/types/websg.d.ts:237](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L237)

## Properties

### intensity

• **intensity**: `number`

#### Defined in

[src/engine/scripting/websg-api.d.ts:225](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L225)

## Accessors

### color

• `get` **color**(): [`RGB`](WebSG.RGB.md)

Returns the color of the Light object as an RGB instance.

**`Example`**

```ts
const light = world.createLight({ type: LightType.Point, color: [1, 0, 0] });
console.log(light.color); // RGB { r: 1, g: 0, b: 0 }
```

#### Returns

[`RGB`](WebSG.RGB.md)

- The color of the Light object.

#### Defined in

[packages/websg-types/types/websg.d.ts:272](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L272)
