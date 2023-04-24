const Player = world.findComponentDefinitionByName("Player");
const Mover = world.findComponentDefinitionByName("Mover");
const Spinner = world.findComponentDefinitionByName("Spinner");
const Coin = world.findComponentDefinitionByName("Coin");
const ExtraLife = world.findComponentDefinitionByName("ExtraLife");
const Obstacle = world.findComponentDefinitionByName("Obstacle");
const Conveyer = world.findComponentDefinitionByName("Conveyer");
const Checkpoint = world.findComponentDefinitionByName("Checkpoint");
const Goal = world.findComponentDefinitionByName("Goal");

const moverQuery = world.createQuery([Mover]);
const spinnerQuery = world.createQuery([Spinner]);
const coinQuery = world.createQuery([Coin]);
const extraLifeQuery = world.createQuery([ExtraLife]);
const obstacleQuery = world.createQuery([Obstacle]);
const conveyerQuery = world.createQuery([Conveyer]);
const checkpointQuery = world.createQuery([Checkpoint]);
const goalQuery = world.createQuery([Goal]);

const coinCollision = new WebSG.Collision();
const extraLifeCollision = new WebSG.Collision();
const obstacleCollision = new WebSG.Collision();
const converyerCollision = new WebSG.Collision();
const checkpointCollision = new WebSG.Collision();
const goalCollision = new WebSG.Collision();

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

function ExtraLifeSystem() {
  for (const node of extraLifeQuery) {
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

function ObstacleSystem() {
  for (const node of obstacleQuery) {
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

let conveyerMaterial;
const conveyerSpeed = 1;

function ConveyerSystem() {
  for (const node of conveyerQuery) {
    if (node.physicsBody.getCollision(obstacleCollision)) {
      const player = obstacleCollision.node.getComponent(Player);

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
    if (node.physicsBody.getCollision(checkpointCollision)) {
      const player = checkpointCollision.node.getComponent(Player);

      if (player) {
        node.audioEmitter.play();
        player.lastSpawnPoint = node;
      }
    }
  }
}

function GoalSystem() {
  for (const node of goalQuery) {
    if (node.physicsBody.getCollision(goalCollision)) {
      const player = goalCollision.node.getComponent(Player);

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
