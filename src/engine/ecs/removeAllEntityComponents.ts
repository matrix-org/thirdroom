import { getEntityComponents, removeComponent } from "bitecs";

import { World } from "../GameTypes";
import { Networked } from "../network/NetworkComponents";

export function removeAllEntityComponents(world: World, eid: number) {
  const components = getEntityComponents(world, eid);

  for (let i = 0; i < components.length; i++) {
    // these components need their data kept around until the end of the frame
    if (components[i] === Networked) {
      removeComponent(world, components[i], eid, false);
    } else {
      removeComponent(world, components[i], eid, true);
    }
  }
}
