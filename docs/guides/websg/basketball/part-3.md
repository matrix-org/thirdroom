# Networking and Web Scene Graph

The Networking module for Web Scene Graph provides a set of APIs for spawning networked objects, synchronizing game state, and sending/receiving messages between peers. In the last part of this tutorial we covered how to create a basic game using the Web Scene Graph. In this part we will cover how to add networking to our game so that basketballs are spawned on all clients when a player shoots a basketball.

::: warning
The WebSG Networking API is currently still under development and is subject to change.
Currently there are some issues with disposal of networked objects and transfer of ownership
of networked objects does not work. We're working on a new underlying networking stack which
should fix these issues without major changes to the WebSG API, but it is not ready yet.
:::

## Network Replicators

We left off with the basketballs spawning properly but only on the local client. If we want the basketball to spawn for other users we need to use something called a Network Replicator. A network replicator uses a factory function to create a node locally and on the remote peers.

Let's move our `spawnBasketball` function into a new network replicator factory function like so:

```js
const basketballReplicator = network.defineReplicator(() => {
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

  // Note that we are not adding the ball to the world here or setting
  // its position or velocity. This is because the network replicator
  // will sync the position and velocity of the ball for us. We just need
  // to create the ball and add the components we want to it.

  // Then we return the node so that we can use it
  return ball;
});
```

We also need to update how we spawn the basketball and add it to the scene:

```js
for (const actionId of actionBarListener.actions()) {
  if (actionId === "basketball") {
    // Instead of calling spawnBasketball we call the spawn method on the
    // network replicator. This will spawn the basketball locally when we
    // press the button and also send a message to the remote peers.
    const ball = basketballReplicator.spawn();
    const origin = world.primaryInputSourceOrigin;
    const direction = world.primaryInputSourceDirection;

    // We set all the initial properties of the basketball here but we don't add it to the
    // world just yet.
    ball.setForwardDirection(direction);
    ball.translation.set(origin).addScaledVector(direction, 0.5);

    const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
    ball.physicsBody.applyImpulse(impulse);
  }
}

// Here we iterate over the spawned basketballs and add them to the world.
// This includes the local and remote nodes.
for (const spawned of basketballReplicator.spawned()) {
  world.environment.addNode(spawned.node);
}

// And here we iterate over the despawned basketballs and remove them from the world
// both locally and remotely
for (const spawned of basketballReplicator.despawned()) {
  world.environment.removeNode(spawned.node);
}
```

At this point our script should look like this:

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

  const basketballReplicator = network.defineReplicator(() => {
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

    return ball;
  });

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

  const teamScores = [0, 0];
  const teamScoreTextElements = [
    createTeamScoreboard(root, "Red", [1, 0, 0, 1]),
    createTeamScoreboard(root, "Blue", [0, 0, 1, 1]),
  ];

  scoreboard.uiCanvas = uiCanvas;

  function countScore(team) {
    const index = team - 1;
    teamScoreTextElements[index].value = teamScores[index] += 2;
    uiCanvas.redraw();
  }

  world.onupdate = () => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId === "basketball") {
        const ball = basketballReplicator.spawn();
        console.log(ball.hasComponent(Basketball));
        const origin = world.primaryInputSourceOrigin;
        const direction = world.primaryInputSourceDirection;

        ball.setForwardDirection(direction);
        ball.translation.set(origin).addScaledVector(direction, 0.5);

        const impulse = new WebSG.Vector3(direction).multiplyScalar(8);
        ball.physicsBody.applyImpulse(impulse);
      }
    }

    for (const spawned of basketballReplicator.spawned()) {
      world.environment.addNode(spawned.node);
    }

    for (const spawned of basketballReplicator.despawned()) {
      world.environment.removeNode(spawned.node);
    }

    for (const collision of collisionListener.collisions()) {
      if (!collision.started) {
        continue;
      }

      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        const sensor = collision.nodeB.getComponent(HoopSensor);
        countScore(sensor.team);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        const sensor = collision.nodeA.getComponent(HoopSensor);
        countScore(sensor.team);
      }
    }
  };
};
```

Save and reload the world and you should now be able to spawn the basketballs and see them in multiple clients.

## Conclusion

In this tutorial series we've built a simple multiplayer basketball game using the Web Scene Graph API. We've covered most of the main concepts of the API including interactables, physics, UI, and networking. This is just the start of what you can do with the API and we hope you'll continue to explore and build amazing things with it!

To build your own apps you're probably going to want to create your own 3D environments to go with it. For that you should head over to the [Third Room Unity Exporter documentation](../../unity/) next.

If you have any questions or feedback please join us on [Matrix](https://matrix.to/#/#thirdroom-dev:matrix.org) and let us know!
