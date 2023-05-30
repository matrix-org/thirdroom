# Diving Deeper Into the Web Scene Graph API

In the last tutorial we learned how to spawn custom interactable objects using the Action Bar API and physics. If you haven't
completed the last tutorial, you can find it [here](./part-1.md).

In this tutorial we will learn how to track when physics objects collide with one another, how to use the WebSG
Entity Component System API to add components to nodes, and how to use the WebSG UI API to create a scoreboard.

## Detecting Collisions

When we left off we had a basketball we could spawn and throw around the scene. Now we want to detect when the
basketball goes through the hoop. This scene already comes with a box collider in each hoop. We can visualize
this collider by pressing `CMD + K` or `Ctrl + K` to open the command palette and typing `Toggle Physics Debug`.
You can toggle this on and off whenever you want to see a wireframe representation of the colliders in the scene.
Static physics bodies will be visualized with orange wireframes and rigid bodies will be visualized with red wireframes.
You'll also see a blue, red, and green line extending from the center of each physics body. These lines represent the
x, y, and z axes of the physics body.

Our hoop colliders are named `HoopSensor1` and `HoopSensor2`. They are marked as triggers, which means they will not
interact with other physics bodies, but they will still trigger collision events. We can use these triggers to detect
when the basketball goes through the hoop.

Our basketball also has a collider, but it is not a trigger. This means it will interact with other physics bodies and
bounce off of them.

To detect these collisions we first need to create a `CollisionListener`, here's the code we left off with in the last
tutorial with the collision listener added:

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

  // First we create the collision listener
  // This will start tracking collision events and queuing them internally
  const collisionListener = world.createCollisionListener();

  function spawnBasketball() {
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    ball.collider = basketballNode.collider;
    ball.addPhysicsBody({
      type: WebSG.PhysicsBodyType.Rigid,
      mass: 1,
    });
    ball.addInteractable({
      type: WebSG.InteractableType.Grabbable,
    });

    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);

    world.environment.addNode(ball);
  }

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        spawnBasketball();
      }
    }

    // Then we can iterate over the collision events. When we call .collisions()
    // the listener will return all of the collision events that have happened
    // since the last call. We should do this every frame so that we always have the
    // latest collisions and don't leak memory from accumulating too many events.
    for (const collision of collisionListener.collisions()) {
      // Each collision event has a nodeA and nodeB property indicating which two nodes collided.
      // This will be the node a physics body is attached to.
      // It also has a started property indicating whether the collision started or ended.
      console.log(
        `Collision between ${collision.nodeA.name} and ${collision.nodeB.name} started: ${collision.started}`
      );
    }
  };
};
```

Now save and run the script. You should see a lot of messages in the console, not only when the basketball
collides with the sensor but when the basketball touches anything. Collision listeners will track all collisions
in the world. We need a way to filter these nodes down to just the basketball and the hoop sensors. We can do this
by using the WebSG Entity Component System API or ECS for short.

## The WebSG ECS API

ECS is a programming pattern that is commonly used in game development. It is a way of organizing your code
for performance, flexibility, and maintainability. ECS is a very large topic and we won't be able to cover all
of it here in this tutorial. The core concepts we are going to focus on is the idea of entities and components.
In the WebSG API, our entities are the nodes in the world. They have an internal unique ID that we use to associate
components with entities. Components are just data that we can attach to entities. We can define their structure in
the glTF file using the `MX_components` extension. In this scene we've already done that for you. The `HoopSensor1` and
`HoopSensor2` nodes have a `HoopSensor` component attached to them. This component has a `team` property that is either
`1` or `2` depending on which hoop it is. We also have a `Basketball` component defined which we can add to each basketball
we spawn in the scene. This component has no properties.

To work with components we first need to get references to their component stores. These are objects that we can then use
to add, remove, and query components. We can get a reference to a component store by calling
`world.findComponentStoreByName()`.

We can add our `Basketball` component to our basketball nodes we spawn by calling `node.addComponent(ComponentStore)`.

We can then check to see if a node has a given component by calling `node.hasComponent(ComponentStore)`. We'll
do this in our collision listener to filter out all of the collisions that don't involve the basketball and the hoop sensors.

We can also get the component data off a node by using `node.getComponent(ComponentStore)`.

```js
// Find the Basketball and HoopSensor component stores
// Note that we're doing this before the world loads.
// This is because we want the component stores to be populated
// with the components from the glTF file and the engine needs to know
// where to store the component data before we load the file.
const Basketball = world.findComponentStoreByName("Basketball");
const HoopSensor = world.findComponentStoreByName("HoopSensor");

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

  const collisionListener = world.createCollisionListener();

  function spawnBasketball() {
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    ball.collider = basketballNode.collider;
    ball.addPhysicsBody({
      type: WebSG.PhysicsBodyType.Rigid,
      mass: 1,
    });
    ball.addInteractable({
      type: WebSG.InteractableType.Grabbable,
    });

    // Add the Basketball component to the basketball node
    ball.addComponent(Basketball);

    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);

    world.environment.addNode(ball);
  }

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        spawnBasketball();
      }
    }

    for (const collision of collisionListener.collisions()) {
      // Let's focus on just the collision events that started this frame
      if (!collision.started) {
        continue;
      }

      // These two branches will check for collisions between the basketball and the hoop sensors
      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        const sensor = collision.nodeB.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        const sensor = collision.nodeA.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      }
    }
  };
};
```

Save and run the script. Now you should only see messages in the console when the basketball collides with the hoop sensors.
It should also say which team the sensor is for. We can use this information to keep track of the score.

## Getting familiar with the WebSG UI API

To keep track of the score we'll use the WebSG UI API to draw a flat UI to a canvas in the 3D world. The WebSG UI
API is based on the CSS Flexbox Layout Model. While you don't need to know all the specifics of the Flexbox API for
this tutorial, it can be extremely helpful to know the basics when designing your own UI. You can learn more about the
Flexbox API [here](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox).

To use the WebSG UI API we first need a `UICanvas` resource that we can draw to. This is a flat 2D plane with an internal
texture that we can draw to. We can create a `UICanvas` by calling `world.createUICanvas()`.

```js
const uiCanvas = world.createUICanvas({
  size: [1, 0.5],
  width: 1024,
  height: 512,
});
```

The `size` property of a canvas represents the physical size of the plane in 3D space. In this example the canvas will
be 1 meter wide and 0.5 meters tall. The `width` and `height` properties represent the resolution of the internal texture
in pixels. In this example the texture will be 1024x512 pixels. This means that if we wanted to draw a square on the canvas
that filled the whole plane we would need to draw a rectangle that was 1024x512 pixels, for one that just filled the top half
of the canvas it would need to be 1024x256 pixels, and so on. It's important to keep the size and resolution of the canvas
in mind when designing your UI. If your resolution is too low then your UI will look blurry. If your resolution is too high
then you'll be wasting memory and performance. If your size and resolution don't match then your UI will be stretched or
squished.

To draw on the canvas we need to create `UIElement` resources and add them to the canvas. There are currently 3 types of
UI Elements:

- UIElement: A generic UI element that can layout child UI elements, have a border, and background color.
- UIText: A UI element that can display text with various fonts, colors, and sizes.
- UIButton: A UI element that we can interact with and display a label.

We can create a `UIElement` by calling `world.createUIElement()`. We can then add it to the canvas by setting
`uiCanvas.root = element`. We can also add child elements to a `UIElement` by calling `element.addChild(child)`.
`UIButton` and `UIText` currently do not allow adding child elements.

Let's get started by just rendering a background color to the canvas. We'll create a `UIElement`, set the background color, and set it as the root element.

```js
const Basketball = world.findComponentStoreByName("Basketball");
const HoopSensor = world.findComponentStoreByName("HoopSensor");

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

  const collisionListener = world.createCollisionListener();

  function spawnBasketball() {
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    ball.collider = basketballNode.collider;
    ball.addPhysicsBody({
      type: WebSG.PhysicsBodyType.Rigid,
      mass: 1,
    });
    ball.addInteractable({
      type: WebSG.InteractableType.Grabbable,
    });

    ball.addComponent(Basketball);

    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);

    world.environment.addNode(ball);
  }

  // Let's create the root UI element for our canvas first, that way
  // we can set it in the factory properties for the canvas.
  const root = world.createUIElement({
    backgroundColor: [0, 0, 0, 0.5], // Black with 50% opacity (RGBA)
    flexDirection: "row", // Lay out child elements horizontally
    width: 1024, // 1024 pixels wide to match the canvas
    height: 512, // 512 pixels tall to match the canvas
  });

  const uiCanvas = world.createUICanvas({
    size: [1, 0.5], // The canvas will be 1 meter wide and 0.5 meters tall
    width: 1024, // The canvas will have a resolution of 1024x512 pixels
    height: 512,
    root, // Set the root element for the canvas
  });

  // Then we need to add the scoreboard to the scene.
  // We've already placed a node in the scene for you to add the canvas to.
  // You can find it by searching for "Scoreboard" in the scene graph.
  const scoreboard = world.findNodeByName("Scoreboard");

  // Set the uiCanvas property to the canvas we created.
  scoreboard.uiCanvas = uiCanvas;

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        spawnBasketball();
      }
    }

    for (const collision of collisionListener.collisions()) {
      if (!collision.started) {
        continue;
      }

      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        const sensor = collision.nodeB.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        const sensor = collision.nodeA.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      }
    }
  };
};
```

Save and run the script and you should now see a black rectangle on the side of the court.

## Finishing the Scoreboard

Now that we have the canvas rendering to the scene, let's add some text elements to track the score. We'll create a new function which will be responsible for rendering the elements for a single team.

Just like a scoreboard you see on a basketball court we'll have the two teams laid out horizontally with each
team's name and score laid out vertically.

```js
// The function will take the scoreboard root UIElement to add the team elements to
// We'll also take the team name and color as parameters
function createTeamScoreboard(scoreboard, teamName, teamColor) {
  // First create a container element to hold the team label
  const teamContainer = world.createUIElement({
    flexDirection: "column", // Lay out child elements vertically
    flexGrow: 1, // Make the container take up all available space
    // Padding is specified as [top, right, bottom, left]
    padding: [100, 0, 0, 100], // Add some padding to the container on the left and top
  });

  // Then create a text element to display the team name
  const teamNameText = world.createUIText({
    value: teamName, // Set the text value to the team name
    fontSize: 128, // Set the font size to 128 pixels tall
    color: teamColor, // Set the text color to the team color
    fontWeight: "bold", // Set the font weight to bold
  });
  teamContainer.addChild(teamNameText); // Add the text element to the container

  // Then create a text element to display the team score
  const teamScoreText = world.createUIText({
    value: "0", // Set the initial score text value to 0
    fontSize: 256, // Set the font size to 256 pixels tall
    color: [1, 1, 1, 1], // Set the text color to white
    fontWeight: "bold", // Set the font weight to bold
    padding: [20, 0, 0, 60], // Add some padding to the text element on the left and top
  });
  teamContainer.addChild(teamScoreText); // Add the text element to the container

  scoreboard.addChild(teamContainer); // Add the container to the scoreboard

  return teamScoreText; // Return the score text element so we can update it later
}
```

Then we'll integrate this into our `onload` function. Here's what our script should look like now:

```js
const Basketball = world.findComponentStoreByName("Basketball");
const HoopSensor = world.findComponentStoreByName("HoopSensor");

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

  const collisionListener = world.createCollisionListener();

  function spawnBasketball() {
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    ball.collider = basketballNode.collider;
    ball.addPhysicsBody({
      type: WebSG.PhysicsBodyType.Rigid,
      mass: 1,
    });
    ball.addInteractable({
      type: WebSG.InteractableType.Grabbable,
    });

    ball.addComponent(Basketball);

    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);

    world.environment.addNode(ball);
  }

  // Add our scoreboard function to the script
  function createTeamScoreboard(scoreboard, teamName, teamColor) {
    const teamContainer = world.createUIElement({
      flexDirection: "column",
      flexGrow: 1,
      padding: [100, 0, 0, 100],
    });

    const teamNameText = world.createUIText({
      value: teamName,
      fontSize: 128,
      color: teamColor,
      fontWeight: "bold",
    });
    teamContainer.addChild(teamNameText);

    const teamScoreText = world.createUIText({
      value: "0",
      fontSize: 256,
      color: [1, 1, 1, 1],
      fontWeight: "bold",
      padding: [20, 0, 0, 60],
    });
    teamContainer.addChild(teamScoreText);

    scoreboard.addChild(teamContainer);

    return teamScoreText;
  }

  const root = world.createUIElement({
    backgroundColor: [0, 0, 0, 0.5],
    flexDirection: "row",
    width: 1024,
    height: 512,
  });

  const uiCanvas = world.createUICanvas({
    size: [1, 0.5],
    width: 1024,
    height: 512,
    root,
  });

  const scoreboard = world.findNodeByName("Scoreboard");

  // Call the scoreboard function for each team
  // We'll store the results in an array so that we can update the scores later
  // using the team index stored in the `HoopSensor` component
  const teamScoreTextElements = [
    createTeamScoreboard(root, "Red", [1, 0, 0, 1]),
    createTeamScoreboard(root, "Blue", [0, 0, 1, 1]),
  ];

  scoreboard.uiCanvas = uiCanvas;

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        spawnBasketball();
      }
    }

    for (const collision of collisionListener.collisions()) {
      if (!collision.started) {
        continue;
      }

      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        const sensor = collision.nodeB.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        const sensor = collision.nodeA.getComponent(HoopSensor);
        console.log(`Basketball collided with hoop sensor for team: ${sensor.team}`);
      }
    }
  };
};
```

Save and run the script and you should see the scoreboard with our two teams displayed on it.

## Keeping Score

Now that we have our scoreboard UI, we need to update the score when the basketball goes through the hoop.
We'll do this by storing a score for each team and then updating the canvas text elements when the Basketball
collides with the HoopSensor for a specific team.

Here's what our script should look like:

```js
const Basketball = world.findComponentStoreByName("Basketball");
const HoopSensor = world.findComponentStoreByName("HoopSensor");

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

  const collisionListener = world.createCollisionListener();

  function spawnBasketball() {
    const ball = world.createNode({
      mesh: basketballNode.mesh,
    });

    ball.collider = basketballNode.collider;
    ball.addPhysicsBody({
      type: WebSG.PhysicsBodyType.Rigid,
      mass: 1,
    });
    ball.addInteractable({
      type: WebSG.InteractableType.Grabbable,
    });

    ball.addComponent(Basketball);

    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);

    world.environment.addNode(ball);
  }

  function createTeamScoreboard(scoreboard, teamName, teamColor) {
    const teamContainer = world.createUIElement({
      flexDirection: "column",
      flexGrow: 1,
      padding: [100, 0, 0, 100],
    });

    const teamNameText = world.createUIText({
      value: teamName,
      fontSize: 128,
      color: teamColor,
      fontWeight: "bold",
    });
    teamContainer.addChild(teamNameText);

    const teamScoreText = world.createUIText({
      value: "0",
      fontSize: 256,
      color: [1, 1, 1, 1],
      fontWeight: "bold",
      padding: [20, 0, 0, 60],
    });
    teamContainer.addChild(teamScoreText);

    scoreboard.addChild(teamContainer);

    return teamScoreText;
  }

  const root = world.createUIElement({
    backgroundColor: [0, 0, 0, 0.5],
    flexDirection: "row",
    width: 1024,
    height: 512,
  });

  const uiCanvas = world.createUICanvas({
    size: [1, 0.5],
    width: 1024,
    height: 512,
    root,
  });

  const scoreboard = world.findNodeByName("Scoreboard");

  // Add an array of scores for each team that we can index by the team id
  const teamScores = [0, 0];
  const teamScoreTextElements = [
    createTeamScoreboard(root, "Red", [1, 0, 0, 1]),
    createTeamScoreboard(root, "Blue", [0, 0, 1, 1]),
  ];

  scoreboard.uiCanvas = uiCanvas;

  // Add a function that we can call to increment the score for a specific team
  function countScore(team) {
    const index = team - 1; // The team id is 1 or 2, but we need to index the array starting at 0
    // Increment the score by 2, maybe you can add support for 3 pointers on your own later?
    teamScoreTextElements[index].value = teamScores[index] += 2;
    // Redraw the canvas to update the text. Without calling this, the text won't update
    uiCanvas.redraw();
  }

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        spawnBasketball();
      }
    }

    for (const collision of collisionListener.collisions()) {
      if (!collision.started) {
        continue;
      }

      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        const sensor = collision.nodeB.getComponent(HoopSensor);
        // Call the countScore function we created above and pass in the team id
        countScore(sensor.team);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        const sensor = collision.nodeA.getComponent(HoopSensor);
        // Do the same thing here
        countScore(sensor.team);
      }
    }
  };
};
```

Save and run the script and you should see the score update when the basketball goes through the hoop.

# Summary and Next Steps

This is the beginnings of a fun little basketball game. There's still a lot more we could add to make it more
fun and interesting, but hopefully this gives you a good idea of how to use the WebSceneGraph API to create
your own apps and games.

Currently the balls spawned are not networked and aren't visible to other users. The scoreboard also only
changes locally. In the last tutorial we'll add networking to the game so that you can play with your friends.
