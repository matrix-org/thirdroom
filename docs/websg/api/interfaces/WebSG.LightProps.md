[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / LightProps

# Interface: LightProps

[WebSG](../modules/WebSG.md).LightProps

LightProps is an interface that defines the properties for creating a Light instance.

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

[packages/websg-types/types/websg.d.ts:248](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L248)

___

### innerConeAngle

• `Optional` **innerConeAngle**: `number`

The optional inner cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:256](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L256)

___

### intensity

• `Optional` **intensity**: `number`

The optional intensity of the light. Default is 1.

#### Defined in

[packages/websg-types/types/websg.d.ts:244](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L244)

___

### name

• `Optional` **name**: `string`

The optional name of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:240](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L240)

___

### outerConeAngle

• `Optional` **outerConeAngle**: `number`

The optional outer cone angle of the light, for spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:260](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L260)

___

### range

• `Optional` **range**: `number`

The optional range of the light, for point and spot lights.

#### Defined in

[packages/websg-types/types/websg.d.ts:252](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L252)

___

### type

• **type**: [`LightType`](../modules/WebSG.md#lighttype)

The type of the light.

#### Defined in

[packages/websg-types/types/websg.d.ts:236](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L236)
