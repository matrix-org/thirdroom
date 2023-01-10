import { getEntityComponents, removeComponent, removeEntity } from "bitecs";

import { RigidBody } from "../physics/physics.game";
import { World } from "../GameTypes";
import { Networked } from "../network/network.game";

export function removeEntityWithComponents(world: World, eid: number) {
  const components = getEntityComponents(world, eid);

  // NOTE: removeEntity does not remove components explicitly, so removing components here triggers exit queries
  for (let i = 0; i < components.length; i++) {
    if (components[i] === Networked || components[i] === RigidBody) {
      removeComponent(world, components[i], eid, false);
    } else {
      removeComponent(world, components[i], eid, true);
    }
  }

  removeEntity(world, eid);
}
