# CollisionListener

**`Class`**

A Collision Listener provides an interface for listening to collisions events between nodes with colliders.
Collision events are recorded for both the start and end of a collision.
[.collisions()](class.CollisionListener.md#collisions) should be called each frame to iterate through
the collisions that occurred since the last call to .collisions(). Failing to regularly call .collisions()
will result in a memory leak. If you are done listening to collisions, you should call .dispose() to free
up the memory used by the collision listener and stop listening to collisions.

**Source:** [websg.d.ts:965](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L965)

## Constructors

### constructor()

> **new CollisionListener**(): [`CollisionListener`](class.CollisionListener.md)

#### Returns

[`CollisionListener`](class.CollisionListener.md)

## Methods

### collisions()

> **collisions**(): [`CollisionIterator`](class.CollisionIterator.md)

Returns an iterator for the collisions that occurred since the last call to .collisions().

**Source:** [websg.d.ts:969](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L969)

#### Returns

[`CollisionIterator`](class.CollisionIterator.md)

### dispose()

> **dispose**(): `void`

Disposes of the collision listener and stops listening to collisions.

**Source:** [websg.d.ts:973](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L973)

#### Returns

`void`
