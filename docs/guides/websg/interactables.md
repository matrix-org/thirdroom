# Interactables

Nodes in a scene can be marked as having an interactable behavior. There are currently two different types of interactables that can be specified:

- **WebSG.InteractableType.Interactable**: The object tracks if it's been pressed, held, or released.
- **WebSG.InteractableType.Grabbable**: The object is made grabbable and can be picked up and moved around.

## Interactable

Interactables are used for any object that you want add a custom behavior to when interacted with. For example, you might want to add a button to toggle the lights in a room.

```js
world.onload = () => {
  const lightSwitch = world.findNodeByName("LightSwitch");
  // Note: LightSwitch must already have a collider and physics body defined
  materialButton.addInteractable(); // Default is InteractableType.Interactable

  let lightSwitchState = false;

  world.onupdate = () => {
    // Get the interactable pressed state.
    if (lightSwitch.interactable.pressed) {
      lightSwitchState = !lightSwitchState;
      // Toggle the light
    }
  };
};
```

## Grabbable

Grabbables are used for any object that you want to be able to pick up and move around. For example, you might want to add a ball that you can pick up and throw.

```js
const ball = world.createNode({
  mesh: sphereMesh,
});

// You must specify a collider and physics body before adding the grabbable interactable behavior
ball.collider = world.createCollider({
  type: WebSG.ColliderType.Sphere,
  radius: 0.5,
});

// Make sure the physics body is rigid so it moves when grabbed
ball.addPhysicsBody({
  type: WebSG.PhysicsBodyType.Rigid,
  mass: 1,
});

// Add the interactable behavior after adding the physics body
ball.addInteractable({
  type: WebSG.InteractableType.Grabbable, // Make the ball grabbable
});
```

For a more complete example, see [Part 1 of the WebSG tutorial series](./basketball/part-1#Grabbables-and-Interactables).
