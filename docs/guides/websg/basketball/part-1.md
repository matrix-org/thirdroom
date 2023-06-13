# Getting Started with Web Scene Graph

In this series we'll be creating a simple basketball game using the Web Scene Graph API.

<!-- Removed because COEP headers :/ -->
<!-- <iframe width="688" height="387" src="https://www.youtube-nocookie.com/embed/VimOoGCPWWw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe> -->

It will be split into 3 parts:

1. Spawning custom interactable objects and the Action Bar API
2. Keeping score with collision listeners and the UI API
3. Networking using the Network Messages and Network Replicator API

## Setup

If you're coming here from the in-world tutorial, you should already have a world set up with the correct settings. If not, create a new world in Third Room using [this scene file](https://thirdroom.io/gltf/BasketballCourt.glb) and [this preview image](https://thirdroom.io/image/BasketballPreview.png). The Room name can be whatever you want and the other settings can be left as default.

Open the editor using the `` ` `` key.

On the left hand side of the editor you can see the hierarchy panel.
You can use this to select objects in the scene and inspect their properties on the right
hand side in the property panel.

In the top left we can switch from the scene editor mode to the script editor mode. Let's
do that now.

In the script editor mode, the hierarchy panel is still visible and can be used to reference
objects in the scene. You can drag and drop nodes from the panel into the script editor to
reference them.

Let's do this now by dragging the `Basketball` node into the editor. Note that the code will
be inserted at the cursor position.

At any point in the code you can use the `console.log()` function to print a message to the
browser's console. You can open your browser's dev tools by pressing `CTRL + SHIFT + I` or `CMD + SHIFT + I` on a Mac. Then select the console tab to see the output. If you get stuck, you can use this to debug your code and see error messages.

## The Web Scene Graph API

The Web Scene Graph API (WebSG) is a WebAssembly API for high level 3D scene graph manipulation.
It is designed to be used for writing sandboxed user generated content in a multiplayer environment.
This tutorial series will be focused on the JavaScript bindings, but it is possible to use any
language that compiles to WebAssembly to write WebSG code.

The WebSG API is designed around the glTF file format. glTF is a 3D file format designed for efficient
transmission of 3D scenes. It is widely adopted in many 3D applications and engines and the ecosystem
is growing rapidly. You can find out more about glTF [here](https://www.khronos.org/gltf/).

While Third Room currently has only implementation of The WebSG API. It is designed such that it can
be ported to other engines and platforms. Enabling truly interoperable 3D experiences. We hope to
standardize the API with the help of the community over time.

## The World

In WebSG, all resources are created and accessed through the global [world](../../../websg-js/namespaces/namespace.WebSG/classes/class.World) object.

The world also has callbacks that can be set to be called for certain lifecycle events.

`world.onload` is called when the world's glTF document is loaded and ready to be interacted with.
`world.onenter` is called when the user enters the world.
`world.onupdate` is called whenever the game loop updates. This is where you should put your game logic.

The script editor comes with a basic template that already has the `world.onload` and `world.onupdate`
set for you.

In the `world.onload` callback, let's use the `world.findNodeByName()` function to find the `Basketball`
node and log its translation.

```js
// Wait for the world to load
world.onload = () => {
  // Now that the world is loaded, we can find the basketball node
  const basketballNode = world.findNodeByName("Basketball");

  // We can temporarily log the translation to the console
  console.log(`Basketball translation: ${basketballNode.translation}`);
};
```

Save and run the script and open the browser console. You should see the basketball's translation
logged once.

## The Action Bar

Great, now that we know how to find nodes in the world. Let's learn how to spawn new ones.

We're going to use the Action Bar API to spawn new basketballs when the user presses a button.

Just like we can find nodes in the world, we can also find image resources in the world using
`world.findImageByName()`. Let's do that now to find the `Basketball` image.

```js
world.onload = () => {
  const basketballNode = world.findNodeByName("Basketball");

  // Just like the node, find the image by its name
  const basketballThumbnail = world.findImageByName("Basketball");
  // Then set the action bar items
  thirdroom.actionBar.setItems([
    {
      id: "basketball", // This is the action id
      label: "Basketball", // This is the label shown to the user in tooltips
      thumbnail: basketballThumbnail, // This is the thumbnail image used in the action bar
    },
  ]);
};
```

Save and run the script. You should see the action bar change to show a basketball icon.

We can now listen for the `basketball` action to be activated by creating an [ActionBarListener](../../../websg-js/namespaces/namespace.ThirdRoom/classes/class.ActionBar).

```js
world.onload = () => {
  const basketballNode = world.findNodeByName("Basketball");

  const basketballThumbnail = world.findImageByName("Basketball");
  thirdroom.actionBar.setItems([
    {
      id: "basketball",
      label: "Basketball",
      thumbnail: basketballThumbnail,
    },
  ]);

  // Create an action bar listener
  const actionBarListener = thirdroom.actionBar.createListener();

  // Add an onupdate callback to check for actions each frame
  world.onupdate = () => {
    // Iterate over all actions since the last call to .actions()
    for (const actionId of actionBarListener.actions()) {
      console.log(`Action ${actionId} activated`);
    }
  };
};
```

Save and run the script. Now, whenever you press the `1` key, you should the action id logged to
the console.

Now let's spawn our basketball.

Lets write a new function for this called `spawnBasketball()`.

```js
world.onload = () => {
  const basketballNode = world.findNodeByName("Basketball");

  const basketballThumbnail = world.findImageByName("Basketball");
  thirdroom.actionBar.setItems([
    {
      id: "basketball",
      label: "Basketball",
      thumbnail: basketballThumbnail,
    },
  ]);

  const actionBarListener = thirdroom.actionBar.createListener();

  function spawnBasketball() {
    // Create a new node using an instance of the basketball's mesh
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    // Grab the local user's origin and direction
    // When using mouse and keyboard this will be the camera (center of your screen).
    // When using WebXR controllers this will be your primary controller.
    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    // We'll set the ball's forward direction to be the same as the user's
    ball.setForwardDirection(direction);
    // Then we'll set the translation to be 0.5 meters in front of the user
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    // And then we'll add it to the environment
    // This is important otherwise the ball will not be rendered
    world.environment.addNode(ball);
  }

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      // Check if the action is the basketball action
      if (actionId === "basketball") {
        // Then call our new spawnBasketball function
        spawnBasketball();
      }
    }
  };
};
```

Save and run the script. Now when you press the `1` key, you should see a basketball spawn in front
of your camera.

But it doesn't do anything yet. It just sits midair. Let's add some physics to it.

## Colliders and Physics Bodies

In order for the basketball to interact with the environment, we need to add a collider and
physics body to it. The collider will be used to detect collisions with other objects and the
physics body will be used to simulate the ball's movement.

The scene we are using already has a sphere collider for the basketball. Let's copy it over to our
new ball. We'll also need to add a physics body to the ball using `node.addPhysicsBody()`

Here's our new `spawnBasketball` function:

```js
function spawnBasketball() {
  const ball = world.createNode({
    mesh: basketballNode.mesh,
  });

  // Collider is a WebSG resource, so we can copy the reference over
  // from the basketball node
  ball.collider = basketballNode.collider;

  // Physics Body is a WebSG behavior and needs to be added to the node.
  // Behaviors have unique instances per node.
  ball.addPhysicsBody({
    type: WebSG.PhysicsBodyType.Rigid, // Rigid bodies are affected by gravity and other forces
    mass: 1, // Mass of the ball in kilograms
  });

  const origin = world.primaryInputSourceOrigin;
  const direction = world.primaryInputSourceDirection;

  ball.setForwardDirection(direction);
  ball.translation.set(origin).addScaledVector(direction, 0.5);

  // Create a new 3 dimensional vector to represent the impulse to apply
  // to the ball. We use the direction vector to create a new vector
  // and scale it by 8 to make it shoot in the direction we're looking faster.
  const impulse = new WebSG.Vector3(direction).multiplyScalar(8);

  // Then we apply the impluse to the ball's physics body
  ball.physicsBody.applyImpulse(impulse);

  world.environment.addNode(ball);
}
```

Save and run the script. Now when you press the `1` key, you should see a basketball spawn in front
of your camera and shoot off in the direction you're looking.

This is great! We can shoot off basketballs but we can't pick them up yet. Let's fix that.

## Grabbables and Interactables

In order to pick up the basketball, we need to make it grabbable. You can make any node with a
physics body grabbable by adding an interactable behavior to it with type `Grabbable`.

```js
function spawnBasketball() {
  const ball = world.createNode({
    mesh: basketballNode.mesh,
  });

  ball.collider = basketballNode.collider;
  ball.addPhysicsBody({
    type: WebSG.PhysicsBodyType.Rigid,
    mass: 1,
  });

  // Add the interactable behavior after adding the physics body
  ball.addInteractable({
    type: WebSG.InteractableType.Grabbable, // Make the ball grabbable
  });

  const origin = world.primaryInputSourceOrigin;
  const direction = world.primaryInputSourceDirection;

  ball.setForwardDirection(direction);
  ball.translation.set(origin).addScaledVector(direction, 0.5);

  const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
  ball.physicsBody.applyImpulse(impulse);

  world.environment.addNode(ball);
}
```

That's it. Save and run the script. Now when you press the `1` key, you should see a basketball spawn
in front of your camera and shoot off in the direction you're looking. You should also be able to
grab it by pressing the left mouse button or `E` key.

# Summary and Next Steps

That's it! You've created a simple scene with a basketball that you can spawn and shoot around.

In the next part of the tutorial we'll track the score of the basketballs you shoot into the hoop
add a scoreboard to the scene.
