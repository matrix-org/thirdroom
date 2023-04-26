[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / LightProps

# Interface: LightProps

[WebSG](../modules/WebSG.md).LightProps

LightProps is an interface that defines the properties for creating a Light instance.
 LightProps

## Table of contents

### Properties

- [color](WebSG.LightProps.md#color)
- [innerConeAngle](WebSG.LightProps.md#innerconeangle)
- [intensity](WebSG.LightProps.md#intensity)
- [name](WebSG.LightProps.md#name)
- [outerConeAngle](WebSG.LightProps.md#outerconeangle)
- [range](WebSG.LightProps.md#range)
- [type](WebSG.LightProps.md#type)

## Properties

### color

• `Optional` **color**: `ArrayLike`<`number`\>

The optional RGB color of the light. Default is white.

#### Defined in

[packages/websg-types/types/websg.d.ts:223](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L223)

___

### innerConeAngle

• `Optional` **innerConeAngle**: `number`

The optional inner cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:225](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L225)

___

### intensity

• `Optional` **intensity**: `number`

The optional intensity of the light. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:222](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L222)

___

### name

• `Optional` **name**: `string`

The optional name of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:221](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L221)

___

### outerConeAngle

• `Optional` **outerConeAngle**: `number`

The optional outer cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:226](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L226)

___

### range

• `Optional` **range**: `number`

The optional range of the light, for point and spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:224](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L224)

___

### type

• **type**: [`LightType`](../modules/WebSG.md#lighttype)

The type of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:220](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L220)
