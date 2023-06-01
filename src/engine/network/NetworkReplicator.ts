import { addComponent } from "bitecs";

import { moveCursorView, sliceCursorView, writeUint32 } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { RemoteNode } from "../resource/RemoteResources";
import { NetworkPacketType } from "./network.common";
import { NetworkModule } from "./network.game";
import { Networked, Owned } from "./NetworkComponents";
import { enqueueReliableBroadcastMessage } from "./NetworkRingBuffer";

export interface Replication {
  nodeId?: number;
  networkId: number;
  data?: ArrayBuffer;
}

export type ReplicatorFactory = (data?: ArrayBuffer) => RemoteNode;

export interface NetworkReplicator {
  id: number;
  ownerId: number;
  spawned: Replication[];
  despawned: number[];
  instances: Replication[];
  factory?: ReplicatorFactory;
  spawnExisting(node: RemoteNode, data?: ArrayBuffer): RemoteNode;
  spawn(data?: ArrayBuffer): RemoteNode;
  despawn(eid: number): void;
}

export const defineReplicator = (ctx: GameState, factory?: ReplicatorFactory) => {
  const network = getModule(ctx, NetworkModule);
  const outgoingRingBuffer = network.outgoingRingBuffer;
  const cursorView = outgoingRingBuffer.cursorView;

  const id = 0; // TODO
  const ownerId = network.hostPeerId;

  const replicator: NetworkReplicator = {
    id,
    ownerId,
    spawned: [],
    despawned: [],
    instances: [],
    factory,
    spawnExisting(node: RemoteNode, data?: ArrayBuffer) {
      const nodeId = node.eid;
      addComponent(ctx.world, Networked, nodeId);
      Networked.replicatorId[nodeId] = this.id;
      const networkId = 0; // TODO
      Networked.networkId[nodeId] = networkId;
      Networked.ownerId[nodeId] = this.ownerId;
      addComponent(ctx.world, Owned, nodeId);

      this.spawned.push({
        nodeId,
        networkId,
        data,
      });

      moveCursorView(cursorView, 0);
      writeUint32(cursorView, network.localPeerId);
      writeUint32(cursorView, NetworkPacketType.Spawn);
      writeUint32(cursorView, this.id);
      writeUint32(cursorView, networkId);
      const message = sliceCursorView(cursorView);
      enqueueReliableBroadcastMessage(network.outgoingRingBuffer, message);

      return node;
    },
    spawn(data?: ArrayBuffer) {
      if (!factory) {
        throw new Error(`Replicator ${id} has no factory and should only be used in a script`);
      }

      const node = factory(data);
      this.spawnExisting(node, data);
      return node;
    },
    despawn(eid: number) {
      if (!factory) {
        throw new Error(`Replicator ${id} has no factory and should only be used in a script`);
      }

      this.despawned.push(eid);
    },
  };

  network.replicators.set(replicator.id, replicator);

  return replicator;
};
