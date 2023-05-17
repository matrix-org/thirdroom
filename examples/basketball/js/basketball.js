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
    alignItems: "space-between",
    flexGrow: 1,
  });

  const teamScores = [0, 0];
  const teamScoreTextElements = [
    createTeamScoreboard(scoreboard, "Red Team"),
    createTeamScoreboard(scoreboard, "Blue Team"),
  ];

  const scoreboard = world.findNodeByName("Scoreboard");
  scoreboard.uiCanvas = world.createUICanvas({
    size: [1, 0.5],
    width: 1024,
    height: 512,
    root,
  });

  function countScore(team) {
    teamScoreTextElements[team].value = teamScores[team] += 1;
  }

  world.onupdate = (dt, time) => {
    for (const actionId of actionBarListener.actions()) {
      if (actionId !== "basketball") {
        continue;
      }

      const ball = world.createNode({
        mesh: basketball.mesh,
      });

      const ray = network.local.primaryInputSource.ray;
      ball.setForwardDirection(ray.direction);
      ball.translation.set(ray.origin).addScaledVector(ray.direction, 0.5);

      ball.collider = basketball.collider;
      ball.addPhysicsBody({
        type: WebSG.PhysicsBodyType.Rigid,
      });
      ball.addInteractable({
        type: WebSG.InteractableType.Grabbable,
      });

      impulse.set(ray.direction).multiplyScalar(33);
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

function createTeamScoreboard(scoreboard, teamName) {
  const teamContainer = world.createUIElement({
    flexGrow: 1,
    flexDirection: "column",
  });

  const teamNameText = world.createUIText({
    value: teamName,
  });
  teamContainer.addChild(teamNameText);

  const teamScoreText = world.createUIText({
    value: "0",
  });
  teamContainer.addChild(teamScoreText);

  scoreboard.addChild(teamContainer);

  return teamScoreText;
}
