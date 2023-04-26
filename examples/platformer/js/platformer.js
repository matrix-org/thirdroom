const Player = world.findComponentStoreByName("Player");
const Mover = world.findComponentStoreByName("Mover");
const Spinner = world.findComponentStoreByName("Spinner");
const Coin = world.findComponentStoreByName("Coin");
const ExtraLife = world.findComponentStoreByName("ExtraLife");
const Obstacle = world.findComponentStoreByName("Obstacle");
const Conveyer = world.findComponentStoreByName("Conveyer");
const Checkpoint = world.findComponentStoreByName("Checkpoint");
const Goal = world.findComponentStoreByName("Goal");

const moverQuery = world.createQuery([Mover]);
const spinnerQuery = world.createQuery([Spinner]);
const coinQuery = world.createQuery([Coin]);
const extraLifeQuery = world.createQuery([ExtraLife]);
const obstacleQuery = world.createQuery([Obstacle]);
const conveyerQuery = world.createQuery([Conveyer]);
const checkpointQuery = world.createQuery([Checkpoint]);
const goalQuery = world.createQuery([Goal]);

function MoverSystem(time) {
  for (const node of moverQuery) {
    node.position.lerp(node.startPosition, node.endPosition, time / node.duration);
  }
}

function SpinnerSystem(time) {
  for (const node of spinnerQuery) {
    const spinner = node.getComponent(Spinner);
    node.rotation.setRotationAxis(spinner.axis, time * spinner.speed);
  }
}

function CoinSystem() {
  for (const node of coinQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const coin = node.getComponent(Coin);
      const player = collision.node.getComponent(Player);

      if (!coin.taken && player) {
        node.audioEmitter.play();
        node.visible = false;
        coin.taken = true;
        player.coins++;
      }
    }
  }
}

function ExtraLifeSystem() {
  for (const node of extraLifeQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const extraLife = node.getComponent(ExtraLife);
      const player = collision.node.getComponent(Player);

      if (!extraLife.taken && player) {
        node.audioEmitter.play();
        node.visible = false;
        extraLife.taken = true;
        player.lives++;
      }
    }
  }
}

function ObstacleSystem() {
  for (const node of obstacleQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const player = collision.node.getComponent(Player);

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

let conveyerMaterial;
const conveyerSpeed = 1;

function ConveyerSystem() {
  for (const node of conveyerQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const player = collision.node.getComponent(Player);

      if (player) {
      }
    }
  }

  conveyerMaterial.baseColorTextureOffset.y += conveyerSpeed * dt;
}

function ScrollingMaterialSystem(dt) {
  for (const material of scrollingMaterialQuery) {
  }
}

function CheckpointSystem() {
  for (const node of checkPointQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const player = collision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();
        player.lastSpawnPoint = node;
      }
    }
  }
}

function GoalSystem() {
  for (const node of goalQuery) {
    for (const collision of node.physicsBody.getCollisions()) {
      const player = collision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();

        // TODO: Show Game Win Screen
      }
    }
  }
}

world.onload = () => {
  conveyerMaterial = world.findMaterialByName("ConveyerMaterial");
};

world.onenter = (playerRig) => {
  playerRig.addComponent(Player);
};

world.onupdate = (dt, time) => {
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
