# Physics

Physics in `WebSG` is run using the Rapier physics engine.

## Colliders

The `Collider` object represents a shape that can be used for collision detection in a physics simulation. It could be attached to a `Node` to give it a physical presence in the world.

```typescript
const boxNode = world.createNode({
  mesh: world.createBoxMesh({
    size: [1, 1, 1],
    segments: [1, 1, 1],
  }),
  collider: world.createCollider({
    type: "box",
    size: [1, 1, 1],
  }),
});
```

## Physics Body

The `PhysicsBody` represents a physical body in the physics simulation. It has properties like mass, velocity, and angular velocity, and needs to have one or more `Collider` objects attached to it for collision detection.

```typescript
// Add a new Rigid PhysicsBody object to the boxNode
boxNode.addPhysicsBody({ type: WebSG.PhysicsBodyType.Rigid });

// Set some properties of the body
boxNode.physicsBody.mass = 1; // 1 kg
boxNode.physicsBody.linearVelocity = [0, 1, 0]; // Initial velocity is 0
```

## Collision Listeners

`CollisionListener` objects are used to listen for collision events between `PhysicsBody` objects.

```typescript
// Create a new CollisionListener object
const collisionListener = world.createCollisionListener();

// Iterate over the collisions queue
for (const collision of collisionListener.collisions()) {
  if (!collision.started) {
    continue;
  }

  // Colliding nodes can be accessed via nodeA and nodeB properties on the collision object
  collision.nodeA;
  collision.nodeB;
}
```
