[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / PhysicsBody

# Class: PhysicsBody

[WebSG](../modules/WebSG.md).PhysicsBody

A PhysicsBody is a behavior that can be added to a node to give it a
physical presence in the world and interact with other physics bodies.

## Table of contents

### Constructors

- [constructor](WebSG.PhysicsBody.md#constructor)

### Methods

- [applyImpulse](WebSG.PhysicsBody.md#applyimpulse)

## Constructors

### constructor

• **new PhysicsBody**()

## Methods

### applyImpulse

▸ **applyImpulse**(`impulse`): `undefined`

Applies an impulse at the center of mass of this physics body.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `impulse` | `ArrayLike`<`number`\> | The impulse to apply. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:931](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L931)
