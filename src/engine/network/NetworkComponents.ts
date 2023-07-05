import { defineComponent, Types } from "bitecs";

import { maxEntities } from "../config.common";

/**
 * Indicates that the entity exists as a networked entity.
 */
export const Networked = defineComponent(
  {
    networkId: Types.ui32, // TODO: make ui64
    authorIndex: Types.ui32, // TODO: make ui64
    replicatorId: Types.ui32,
    lastUpdate: Types.f64,
    destroyOnLeave: Types.ui8,
    position: [Types.f32, 3],
    quaternion: [Types.f32, 4],
    velocity: [Types.f32, 3],
  },
  maxEntities
);

/**
 * Indicates that the current peer's simulation is responsible for dictating source-of-truth updates about the entity.
 */
export const Authoring = defineComponent();

/**
 * Indicates that the current peer is only responsible for relaying the source-of-truth which is being received by the authoring peer.
 */
export const Relaying = defineComponent(
  {
    for: Types.ui32, // TODO: make ui64
  },
  maxEntities
);

/**
 * Indicates that an entity's authoring peer should be changed
 */
export const TransferAuthority = defineComponent(
  {
    to: Types.ui32, // TODO: make ui64
  },
  maxEntities
);
