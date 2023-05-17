import { GameNetworkState } from "./network.game";

export interface Replication {
  nodeId?: number;
  networkId?: number;
  peerIndex: number;
  data?: ArrayBuffer;
}

export interface Replicator {
  spawned: Replication[];
  despawned: Replication[];
  deferredUpdates: { nid: number; position: Float32Array; quaternion: Float32Array }[];
  nidToData: Map<number, ArrayBuffer>;
}

export const createReplicator = (network: GameNetworkState, prefab: string) => {
  const spawned: Replication[] = [];
  const despawned: Replication[] = [];
  const replicator: Replicator = {
    spawned,
    despawned,
    nidToData: new Map(),
    deferredUpdates: [],
  };
  network.prefabToReplicator.set(prefab, replicator);
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
