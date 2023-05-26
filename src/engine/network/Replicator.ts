import { RemoteResourceManager } from "../GameTypes";
import { GameNetworkState } from "./network.game";

export interface Replication {
  nodeId?: number;
  networkId?: number;
  peerIndex: number;
  data?: ArrayBuffer;
}

export interface Replicator {
  id: number;
  prefabName: string;
  spawned: Replication[];
  despawned: Replication[];
  eidToData: Map<number, ArrayBuffer>;
}

export const createReplicator = (network: GameNetworkState, resourceManager: RemoteResourceManager) => {
  const id = resourceManager.nextReplicatorId++;
  const prefabName = `replicator-${resourceManager.id}-${id}`;

  const replicator: Replicator = {
    id,
    prefabName,
    spawned: [],
    despawned: [],
    eidToData: new Map(),
  };

  network.prefabToReplicator.set(prefabName, replicator);
  resourceManager.replicators.set(id, replicator);

  return replicator;
};

export const getReplicator = (network: GameNetworkState, prefabName: string) => {
  return network.prefabToReplicator.get(prefabName);
};

export const tryGetReplicator = (network: GameNetworkState, prefabName: string) => {
  const replicator = network.prefabToReplicator.get(prefabName);
  if (!replicator) {
    throw new Error(`Unable to create replicated network entity: replicator not found for prefab ${prefabName}.`);
  }
  return replicator;
};
