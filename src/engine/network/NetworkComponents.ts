import { defineComponent, defineQuery, enterQuery, exitQuery, Not, Types } from "bitecs";

import { Player } from "../component/Player";
import { maxEntities } from "../config.common";

/* Components */

export const Networked = defineComponent(
  {
    networkId: Types.ui32,
    ownerId: Types.ui32,
    replicatorId: Types.ui32,
    synchronizerId: Types.ui32,
    lastSyncTime: Types.ui32,
  },
  maxEntities
);

export const Owned = defineComponent();

/* Queries */

export const networkedQuery = defineQuery([Networked]);
export const exitedNetworkedQuery = exitQuery(networkedQuery);

export const ownedNetworkedQuery = defineQuery([Networked, Owned]);
export const spawnedNetworkedQuery = enterQuery(ownedNetworkedQuery);
export const despawnedNetworkedQuery = exitQuery(ownedNetworkedQuery);

export const remoteNetworkedQuery = defineQuery([Networked, Not(Owned)]);

export const ownedPlayerQuery = defineQuery([Player, Owned]);
export const enteredOwnedPlayerQuery = enterQuery(ownedPlayerQuery);
export const exitedOwnedPlayerQuery = exitQuery(ownedPlayerQuery);

export const remotePlayerQuery = defineQuery([Player, Not(Owned)]);
export const enteredRemotePlayerQuery = enterQuery(remotePlayerQuery);
export const exitedRemotePlayerQuery = exitQuery(remotePlayerQuery);
