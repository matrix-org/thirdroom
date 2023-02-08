import { defineComponent, Types } from "bitecs";

import { maxEntities } from "../config.common";

/* Components */

export const Networked = defineComponent(
  {
    // networkId contains both peerIdIndex (owner) and localNetworkId
    networkId: Types.ui32,
    // TODO: split net ID into 2 32bit ints
    // ownerId: Types.ui32,
    // localId: Types.ui32,
    parent: Types.ui32,
    position: [Types.f32, 3],
    quaternion: [Types.f32, 4],
    velocity: [Types.f32, 3],
  },
  maxEntities
);

export const Owned = defineComponent();
