[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / LightProps

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

[packages/websg-types/types/websg.d.ts:231](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L231)

___

### innerConeAngle

• `Optional` **innerConeAngle**: `number`

The optional inner cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:233](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L233)

___

### intensity

• `Optional` **intensity**: `number`

The optional intensity of the light. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:230](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L230)

___

### name

• `Optional` **name**: `string`

The optional name of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:229](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L229)

___

### outerConeAngle

• `Optional` **outerConeAngle**: `number`

The optional outer cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:234](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L234)

___

### range

• `Optional` **range**: `number`

The optional range of the light, for point and spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:232](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L232)

___

### type

• **type**: [`LightType`](../modules/WebSG.md#lighttype)

The type of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:228](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L228)
