[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / OrbitOptions

# Interface: OrbitOptions

[WebSG](../modules/WebSG.md).OrbitOptions

Interface representing the options for configuring an orbiting camera control mode.

## Table of contents

### Properties

- [pitch](WebSG.OrbitOptions.md#pitch)
- [yaw](WebSG.OrbitOptions.md#yaw)
- [zoom](WebSG.OrbitOptions.md#zoom)

## Properties

### pitch

• `Optional` **pitch**: `number`

The pitch angle in degrees, which is the rotation around the X-axis.
Positive values tilt the camera upwards, while negative values tilt it downwards.

#### Defined in

[packages/websg-types/types/websg.d.ts:677](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L677)

___

### yaw

• `Optional` **yaw**: `number`

The yaw angle in degrees, which is the rotation around the Y-axis.
Positive values rotate the camera to the right, while negative values rotate it to the left.

#### Defined in

[packages/websg-types/types/websg.d.ts:683](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L683)

___

### zoom

• `Optional` **zoom**: `number`

The zoom value, which is a scalar factor for the distance from the object.
Positive values move the camera closer to the object, while negative values move it further away.

#### Defined in

[packages/websg-types/types/websg.d.ts:689](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L689)
