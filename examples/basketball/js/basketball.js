const Basketball = world.findComponentStoreByName("Basketball");
const HoopSensor = world.findComponentStoreByName("HoopSensor");

world.onload = () => {
  const actionBarListener = thirdroom.actionBar.createListener();
  const thumbnail = world.findImageByName("Basketball");

  thirdroom.actionBar.setItems([
    {
      id: "basketball",
      label: "Basketball",
      thumbnail,
    },
  ]);

  const basketball = world.findNodeByName("Basketball");
  const impulse = new WebSG.Vector3();

  const collisionListener = world.createCollisionListener();

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

  world.onupdate = (dt, time) => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId !== "basketball") {
        continue;
      }

      const ball = world.createNode({
        mesh: basketball.mesh,
      });

      const origin = world.primaryInputSourceOrigin;
      const direction = world.primaryInputSourceDirection;

      ball.setForwardDirection(direction);
      ball.translation.set(origin).addScaledVector(direction, 0.5);

      ball.collider = basketball.collider;
      ball.addPhysicsBody({
        type: WebSG.PhysicsBodyType.Rigid,
        mass: 1,
      });
      ball.addInteractable({
        type: WebSG.InteractableType.Grabbable,
      });
      ball.addComponent(Basketball);

      impulse.set(direction).multiplyScalar(8);
      ball.physicsBody.applyImpulse(impulse);

      world.environment.addNode(ball);
    }

    for (const collision of collisionListener.collisions()) {
      if (!collision.started) {
        continue;
      }

      if (collision.nodeA.hasComponent(Basketball) && collision.nodeB.hasComponent(HoopSensor)) {
        countScore(collision.nodeB.getComponent(HoopSensor).team);
      } else if (collision.nodeB.hasComponent(Basketball) && collision.nodeA.hasComponent(HoopSensor)) {
        countScore(collision.nodeA.getComponent(HoopSensor).team);
      }
    }
  };
};

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
