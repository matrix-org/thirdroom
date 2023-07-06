import { addComponent } from "bitecs";

import { getModule } from "../module/module.common";
import { RemoteNode } from "../resource/RemoteResources";
import { GameNetworkState, NetworkModule, createNetworkId } from "./network.game";
import { Networked } from "./NetworkComponents";
import { GameContext } from "../GameTypes";
import { Queue, createQueue } from "../utils/Queue";
import { Codec } from "./Codec";
import { isHost } from "./network.common";

export interface NetworkReplication {
  node: RemoteNode;
  data?: ArrayBuffer;
}

export type NetworkReplicatorFactory = (ctx: GameContext, data?: ArrayBuffer) => RemoteNode;

export interface NetworkReplicator<T> {
  id: number;
  spawned: Queue<NetworkReplication>;
  despawned: Queue<RemoteNode>;
  instances: RemoteNode[];
  snapshotCodec: Codec<T>;
  mutationCodec: Codec<T>;
  factory: NetworkReplicatorFactory;
  spawn: NetworkReplicatorFactory;
  despawn: (node: RemoteNode) => void;
}

export const createNetworkReplicator = <T>(
  ctx: GameContext,
  factory: NetworkReplicatorFactory,
  snapshotCodec: Codec<T>,
  mutationCodec?: Codec<T>
): NetworkReplicator<T> => {
  const network = getModule(ctx, NetworkModule);

  const id = network.replicatorIdCount++;

  const instances: RemoteNode[] = [];
  const spawned = createQueue<NetworkReplication>();
  const despawned = createQueue<RemoteNode>();

  const spawn = (ctx: GameContext, data?: ArrayBuffer) => {
    if (!isHost(network)) {
      throw new Error("Only hosts can spawn items.");
    }

    const node = factory(ctx, data);
    const eid = node.eid;

    addComponent(ctx.world, Networked, eid);
    const networkId = createNetworkId(network);
    Networked.networkId[eid] = Number(networkId);
    network.networkIdToEntityId.set(networkId, eid);
    Networked.replicatorId[eid] = id;
    Networked.destroyOnLeave[eid] = 1;

    spawned.enqueue({
      node,
      data,
    });

    instances.push(node);

    return node;
  };

  const despawn = (node: RemoteNode) => {
    if (!isHost(network)) {
      throw new Error("Only hosts can despawn items.");
    }
    despawned.enqueue(node);
  };

  const replicator: NetworkReplicator<T> = {
    id,
    instances,
    spawned,
    despawned,
    spawn,
    despawn,
    factory,
    snapshotCodec,
    mutationCodec: mutationCodec || snapshotCodec,
  };

  network.replicators.set(id, replicator);

  return replicator;
};

export const tryGetNetworkReplicator = <T>(network: GameNetworkState, id: number) => {
  const replicator = network.replicators.get(id);
  if (!replicator) {
    throw new Error("Replicator not found for replicatorId: " + id);
  }
  return replicator as NetworkReplicator<T>;
};
export const getNetworkReplicator = <T>(network: GameNetworkState, id: number) =>
  network.replicators.get(id) as NetworkReplicator<T>;
