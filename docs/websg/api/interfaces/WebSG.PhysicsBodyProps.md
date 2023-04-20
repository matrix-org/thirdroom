[Exports](../modules.md) / [WebSG](../modules/websg) / PhysicsBodyProps

# Interface: PhysicsBodyProps

[WebSG](../modules/WebSG.md).PhysicsBodyProps

Interface representing the properties for creating a PhysicsBody.

## Table of contents

### Properties

- [angularVelocity](WebSG.PhysicsBodyProps.md#angularvelocity)
- [inertiaTensor](WebSG.PhysicsBodyProps.md#inertiatensor)
- [linearVelocity](WebSG.PhysicsBodyProps.md#linearvelocity)
- [type](WebSG.PhysicsBodyProps.md#type)

## Properties

### angularVelocity

• `Optional` **angularVelocity**: `ArrayLike`<`number`\>

The angular velocity of the physics body as an array of three numbers [x, y, z].

#### Defined in

[packages/websg-types/types/websg.d.ts:845](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L845)

---

### inertiaTensor

• `Optional` **inertiaTensor**: `ArrayLike`<`number`\>

The inertia tensor of the physics body as an array of three numbers [ix, iy, iz].

#### Defined in

[packages/websg-types/types/websg.d.ts:851](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L851)

---

### linearVelocity

• `Optional` **linearVelocity**: `ArrayLike`<`number`\>

The linear velocity of the physics body as an array of three numbers [x, y, z].

#### Defined in

[packages/websg-types/types/websg.d.ts:839](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L839)

---

### type

• **type**: `PhysicsBodyType`

The type of the physics body.

#### Defined in

[packages/websg-types/types/websg.d.ts:833](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L833)
