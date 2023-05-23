[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / PhysicsBodyProps

# Interface: PhysicsBodyProps

[WebSG](../modules/WebSG.md).PhysicsBodyProps

Interface representing the properties for creating a PhysicsBody.

## Table of contents

### Properties

- [angularVelocity](WebSG.PhysicsBodyProps.md#angularvelocity)
- [inertiaTensor](WebSG.PhysicsBodyProps.md#inertiatensor)
- [linearVelocity](WebSG.PhysicsBodyProps.md#linearvelocity)
- [mass](WebSG.PhysicsBodyProps.md#mass)
- [type](WebSG.PhysicsBodyProps.md#type)

## Properties

### angularVelocity

• `Optional` **angularVelocity**: `ArrayLike`<`number`\>

The angular velocity of the physics body as an array of three numbers [x, y, z].

#### Defined in

[packages/websg-types/types/websg.d.ts:913](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L913)

___

### inertiaTensor

• `Optional` **inertiaTensor**: `ArrayLike`<`number`\>

The inertia tensor of the physics body as an array of nine numbers representing a 3x3 matrix.
 This property is experimental and may be changed in a future release.

#### Defined in

[packages/websg-types/types/websg.d.ts:919](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L919)

___

### linearVelocity

• `Optional` **linearVelocity**: `ArrayLike`<`number`\>

The linear velocity of the physics body as an array of three numbers [x, y, z].

#### Defined in

[packages/websg-types/types/websg.d.ts:908](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L908)

___

### mass

• `Optional` **mass**: `number`

The mass of the physics body in kilograms.

#### Defined in

[packages/websg-types/types/websg.d.ts:903](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L903)

___

### type

• **type**: `PhysicsBodyType`

The type of the physics body.

#### Defined in

[packages/websg-types/types/websg.d.ts:898](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L898)
