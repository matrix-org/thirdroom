import { addComponent, hasComponent } from "bitecs";

import { sliceCursorView, CursorView, writeUint32, readUint32, createCursorView } from "../allocator/CursorView";
import { addChild, removeNode } from "../component/transform";
import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { RemoteNodeComponent } from "../node/RemoteNodeComponent";
import { RigidBody } from "../physics/physics.game";
import { getPrefabTemplate, Prefab } from "../prefab/prefab.game";
import { GameNetworkState, Networked, NetworkModule, Owned } from "./network.game";
import { NetworkAction } from "./NetworkAction";
import { broadcastReliable } from "./outbound.game";
import { writeMetadata, NetPipeData } from "./serialization.game";

const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 3));

export const createRemoveOwnershipMessage = (ctx: GameState, eid: number) => {
  writeMetadata(NetworkAction.RemoveOwnershipMessage)([ctx, messageView]);
  serializeRemoveOwnership(messageView, eid);
  return sliceCursorView(messageView);
};

export const serializeRemoveOwnership = (cv: CursorView, eid: number) => {
  writeUint32(cv, Networked.networkId[eid]);
};

export const deserializeRemoveOwnership = (input: NetPipeData) => {
  const [ctx, cv] = input;
  const network = getModule(ctx, NetworkModule);
  const nid = readUint32(cv);
  const eid = network.networkIdToEntityId.get(nid);
  const node = eid ? RemoteNodeComponent.get(eid) : undefined;
  if (node) {
    removeNode(ctx, node);
  }
};

export const takeOwnership = (ctx: GameState, network: GameNetworkState, eid: number): number => {
  if (!hasComponent(ctx.world, Owned, eid)) {
    removeNode(ctx, node);

    const prefabName = Prefab.get(eid);
    if (!prefabName) throw new Error("could not take ownership, prefab name not found: " + prefabName);

    const template = getPrefabTemplate(ctx, prefabName);
    const newNode = template.create(ctx);
    const newEid = newNode.eid;

    const body = RigidBody.store.get(eid);
    if (!body) throw new Error("rigidbody not found for eid: " + eid);

    newNode.position.set(node.position);
    newNode.scale.set(node.scale);
    newNode.quaternion.set(node.quaternion);

    addComponent(ctx.world, Owned, newEid);
    addComponent(ctx.world, Networked, newEid);

    if (template.type === PrefabType.Avatar) {
      ctx.worldResource.avatars = [
        ...ctx.worldResource.avatars,
        new RemoteAvatar(ctx.resourceManager, {
          root: node,
        }),
      ];
    } else if (template.type === PrefabType.Object) {
      addChild(ctx, ctx.worldResource.transientScene!, node);
    } else {
      throw new Error("Unknown prefab type");
    }

    // send message to remove on other side
    broadcastReliable(ctx, network, createRemoveOwnershipMessage(ctx, eid));

    return newEid;
  }

  return NOOP;
};
