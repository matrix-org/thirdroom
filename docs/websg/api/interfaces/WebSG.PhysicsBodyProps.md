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

[packages/websg-types/types/websg.d.ts:855](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L855)

___

### inertiaTensor

• `Optional` **inertiaTensor**: `ArrayLike`<`number`\>

The inertia tensor of the physics body as an array of three numbers [ix, iy, iz].

#### Defined in

[packages/websg-types/types/websg.d.ts:861](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L861)

___

### linearVelocity

• `Optional` **linearVelocity**: `ArrayLike`<`number`\>

The linear velocity of the physics body as an array of three numbers [x, y, z].

#### Defined in

[packages/websg-types/types/websg.d.ts:849](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L849)

___

### mass

• `Optional` **mass**: `number`

#### Defined in

[packages/websg-types/types/websg.d.ts:843](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L843)

___

### type

• **type**: `PhysicsBodyType`

The type of the physics body.

#### Defined in

[packages/websg-types/types/websg.d.ts:841](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L841)
