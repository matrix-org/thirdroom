const Player = world.defineComponent("Player", {
  coins: {
    type: WebSG.Property.Float32,
  },
  lives: {
    type: WebSG.Property.Float32,
    default: 3,
  },
  lastSpawnPoint: {
    type: WebSG.Property.Node,
  },
});

const Mover = world.defineComponent("Mover", {
  startPosition: {
    type: WebSG.Property.Vector3,
  },
  endPosition: {
    type: WebSG.Property.Vector3,
  },
  duration: {
    type: WebSG.Property.Float32,
  },
});
const moverQuery = world.createNodeQuery([Mover]);

function MoverSystem(time) {
  for (const node of moverQuery()) {
    node.position.lerp(node.startPosition, node.endPosition, time / node.duration);
  }
}

const Spinner = world.defineComponent("Spinner", {
  axis: {
    type: WebSG.Property.Vector3,
    default: new WebSG.Vector3(0, 1, 0),
  },
  speed: {
    type: WebSG.Property.Float32,
    default: 1,
  },
});
const spinnerQuery = world.createNodeQuery([Spinner]);

function SpinnerSystem(time) {
  for (const node of spinnerQuery()) {
    const spinner = node.getComponent(spinnerQuery);
    node.rotation.setRotationAxis(spinner.axis, time * spinner.speed);
  }
}

const Coin = world.defineComponent("Coin", {
  taken: {
    type: WebSG.Property.Boolean,
  },
});
const coinQuery = world.createNodeQuery([Coin]);

const coinCollision = new WebSG.Collision();

function CoinSystem() {
  for (const node of coinQuery()) {
    if (node.physicsBody.getCollision(coinCollision)) {
      const coin = node.getComponent(Coin);
      const player = coinCollision.node.getComponent(Player);

      if (!coin.taken && player) {
        node.audioEmitter.play();
        node.visible = false;
        coin.taken = true;
        player.coins++;
      }
    }
  }
}

const ExtraLife = world.defineComponent("ExtraLife", {
  taken: {
    type: WebSG.Property.Boolean,
  },
});
const extraLifeQuery = world.createNodeQuery([ExtraLife]);

const extraLifeCollision = new WebSG.Collision();

function ExtraLifeSystem() {
  for (const node of extraLifeQuery()) {
    if (node.physicsBody.getCollision(extraLifeCollision)) {
      const extraLife = node.getComponent(ExtraLife);
      const player = coinCollision.node.getComponent(Player);

      if (!extraLife.taken && player) {
        node.audioEmitter.play();
        node.visible = false;
        extraLife.taken = true;
        player.lives++;
      }
    }
  }
}

const Obstacle = world.defineComponent("Obstacle");
const obstacleQuery = world.createNodeQuery([Obstacle]);

const obstacleCollision = new WebSG.Collision();

function ObstacleSystem() {
  for (const node of obstacleQuery()) {
    if (node.physicsBody.getCollision(obstacleCollision)) {
      const player = obstacleCollision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();
        player.translation = player.lastSpawnPoint.translation;
        player.rotation = player.lastSpawnPoint.rotation;
        player.lives--;

        if (player.lives == 0) {
          // TODO: Game Over Screen
        }
      }
    }
  }
}

const Conveyer = world.defineComponent("Conveyer", {
  direction: {
    type: WebSG.Property.Vector3,
    default: new WebSG.Vector3(0, 0, 1),
  },
  speed: {
    type: WebSG.Property.Float32,
    default: 1,
  },
});
const conveyerQuery = world.createNodeQuery([Conveyer]);

const converyerCollision = new WebSG.Collision();

function ConveyerSystem() {
  for (const node of conveyerQuery()) {
    if (node.physicsBody.getCollision(obstacleCollision)) {
      const player = obstacleCollision.node.getComponent(Player);

      if (player) {
      }
    }
  }
}

const ScrollingMaterial = world.defineComponent("ScrollingMaterial", {
  direction: {
    type: WebSG.Property.Vector3,
    default: new WebSG.Vector2(0, 1),
  },
  speed: {
    type: WebSG.Property.Float32,
    default: 1,
  },
});
const scrollingMaterialQuery = world.createMaterialQuery([ScrollingMaterial]);
const tempOffset = new WebSG.Vector2();

function ScrollingMaterialSystem(dt) {
  for (const material of scrollingMaterialQuery()) {
    const scrollingMaterial = material.getComponent(ScrollingMaterial);
    tempOffset.copy(scrollingMaterial.direction).multiplyScalar(scrollingMaterial.speed * dt);
    material.baseColorTextureOffset.add(tempOffset);
  }
}

const Checkpoint = world.defineComponent("Checkpoint");
const checkpointQuery = world.createNodeQuery([Checkpoint]);

const checkpointCollision = new WebSG.Collision();

function CheckpointSystem() {
  for (const node of checkPointQuery()) {
    if (node.physicsBody.getCollision(checkpointCollision)) {
      const player = checkpointCollision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();
        player.lastSpawnPoint = node;
      }
    }
  }
}

const Goal = world.defineComponent();
const goalQuery = world.createNodeQuery([Goal]);

const goalCollision = new WebSG.Collision();

function GoalSystem() {
  for (const node of goalQuery()) {
    if (node.physicsBody.getCollision(goalCollision)) {
      const player = goalCollision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();

        // TODO: Show Game Win Screen
      }
    }
  }
}

onenter = (playerRig) => {
  playerRig.addComponent(Player);
};

onupdate = (dt, time) => {
  MoverSystem(time);
  SpinnerSystem(time);
  ConveyerSystem();
  ScrollingMaterialSystem(dt);
  CoinSystem();
  ExtraLifeSystem();
  ObstacleSystem();
  CheckpointSystem();
  GoalSystem();
};
