# PhysicsBodyProps

**`Interface`**

Interface representing the properties for creating a PhysicsBody.

**Source:** [websg.d.ts:891](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L891)

## Properties

### angularVelocity

> **angularVelocity**?: `ArrayLike`\<`number`\>

The angular velocity of the physics body as an array of three numbers [x, y, z].

**Source:** [websg.d.ts:910](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L910)

### inertiaTensor

> **inertiaTensor**?: `ArrayLike`\<`number`\>

The inertia tensor of the physics body as an array of nine numbers representing a 3x3 matrix.
This property is experimental and may be changed in a future release.

**Source:** [websg.d.ts:916](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L916)

### linearVelocity

> **linearVelocity**?: `ArrayLike`\<`number`\>

The linear velocity of the physics body as an array of three numbers [x, y, z].

**Source:** [websg.d.ts:905](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L905)

### mass

> **mass**?: `number`

The mass of the physics body in kilograms.

**Source:** [websg.d.ts:900](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L900)

### type

> **type**: [`PhysicsBodyType`](../variables/variable.PhysicsBodyType-1.md)

The type of the physics body.

**Source:** [websg.d.ts:895](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L895)
