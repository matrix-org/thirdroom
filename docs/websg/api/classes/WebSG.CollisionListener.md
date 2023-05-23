[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / CollisionListener

# Class: CollisionListener

[WebSG](../modules/WebSG.md).CollisionListener

A Collision Listener provides an interface for listening to collisions events between nodes with colliders.
Collision events are recorded for both the start and end of a collision.
[.collisions()](WebSG.CollisionListener.md#collisions) should be called each frame to iterate through
the collisions that occurred since the last call to .collisions(). Failing to regularly call .collisions()
will result in a memory leak. If you are done listening to collisions, you should call .dispose() to free
up the memory used by the collision listener and stop listening to collisions.

## Table of contents

### Constructors

- [constructor](WebSG.CollisionListener.md#constructor)

### Methods

- [collisions](WebSG.CollisionListener.md#collisions)
- [dispose](WebSG.CollisionListener.md#dispose)

## Constructors

### constructor

• **new CollisionListener**()

## Methods

### collisions

▸ **collisions**(): [`CollisionIterator`](WebSG.CollisionIterator.md)

Returns an iterator for the collisions that occurred since the last call to .collisions().

#### Returns

[`CollisionIterator`](WebSG.CollisionIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:972](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L972)

___

### dispose

▸ **dispose**(): `void`

Disposes of the collision listener and stops listening to collisions.

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:976](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L976)
