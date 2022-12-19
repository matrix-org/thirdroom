import { addComponent, addEntity, defineComponent, defineQuery, enterQuery, hasComponent, Types } from "bitecs";
import { mat4, vec3 } from "gl-matrix";
import { radToDeg } from "three/src/math/MathUtils";

import { addChild, findChild, getForwardVector, getPitch, getRoll } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { projectPerspective } from "../../engine/camera/camera.game";
import { NetworkModule } from "../../engine/network/network.game";
import { RendererModule } from "../../engine/renderer/renderer.game";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../../engine/node/node.game";
import { NametagsEnableMessage, NametagsEnableMessageType } from "./nametags.common";
import { ourPlayerQuery } from "../../engine/component/Player";
import { NametagResource, RemoteNode } from "../../engine/resource/schema";

type NametagState = {
  enabled: boolean;
};

export const NametagModule = defineModule<GameState, NametagState>({
  name: "nametags",
  create() {
    return {
      enabled: false,
    };
  },
  init(ctx) {
    return registerMessageHandler(ctx, NametagsEnableMessage, onNametagsEnabledMessage);
  },
});

function onNametagsEnabledMessage(ctx: GameState, message: NametagsEnableMessageType) {
  const nametagModule = getModule(ctx, NametagModule);
  nametagModule.enabled = message.enabled;
}
export const NametagComponent = defineComponent({
  entity: Types.eid,
  resourceId: Types.ui32,
});
const nametagQuery = defineQuery([NametagComponent]);
const enteredNametagQuery = enterQuery(nametagQuery);

const _v = vec3.create();
const _t = vec3.create();
const _forward = vec3.create();

export function NametagSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const renderer = getModule(ctx, RendererModule);
  const nametagModule = getModule(ctx, NametagModule);
  const ourPlayer = ourPlayerQuery(ctx.world)[0];

  if (nametagModule.enabled && ourPlayer) {
    const playerNode = RemoteNodeComponent.get(ourPlayer)!;
    const ourWorldPosition = playerNode.position;

    const entered = enteredNametagQuery(ctx.world);
    for (let i = 0; i < entered.length; i++) {
      const eid = entered[i];
      const player = NametagComponent.entity[eid];

      const peerId = network.entityIdToPeerId.get(player);

      if (!peerId) {
        console.warn("could not add nametag resource, no peerId for entity: ", eid);
        continue;
      }

      const nametagResource = ctx.resourceManager.createResource(NametagResource, {
        name: peerId,
      });

      NametagComponent.resourceId[eid] = nametagResource.resourceId;

      addRemoteNodeComponent(ctx, player, {
        nametag: nametagResource,
      });
    }

    const nametagEnts = nametagQuery(ctx.world);
    for (let i = 0; i < nametagEnts.length; i++) {
      const nametag = nametagEnts[i];
      const nametagNode = RemoteNodeComponent.get(nametag)!;
      const player = NametagComponent.entity[nametag];

      // projection to camera space
      const nametagWorldPosition = mat4.getTranslation(_v, nametagNode.worldMatrix);
      const projected = projectPerspective(ctx, ctx.activeCamera!, nametagWorldPosition);

      const peerId = network.entityIdToPeerId.get(player);
      if (peerId === undefined) {
        // console.warn("could not find peerId for entityId " + nametag);
        continue;
      }

      const dist = vec3.dist(nametagWorldPosition, ourWorldPosition);

      const quaternion = playerNode.quaternion;
      const pitch = getPitch(quaternion);
      const roll = getRoll(quaternion);
      const forward = getForwardVector(_forward, pitch, roll);

      const target = vec3.sub(_t, nametagWorldPosition, ourWorldPosition);
      vec3.normalize(target, target);

      const dot = vec3.dot(target, forward);
      const angle = radToDeg(Math.acos(dot));

      const remoteNode = RemoteNodeComponent.get(player);
      if (remoteNode === undefined) throw new Error("could not find remote node for player " + peerId);
      if (remoteNode.nametag === undefined) throw new Error("could not find nametag resource for player " + peerId);

      if (angle < 100) {
        // projection to screenspace
        const screenX = Math.round((0.5 + projected[0] / 2) * renderer.canvasWidth);
        const screenY = Math.round((0.5 - projected[1] / 2) * renderer.canvasHeight);

        remoteNode.nametag.screenX = screenX;
        remoteNode.nametag.screenY = screenY;
        remoteNode.nametag.distanceFromCamera = dist;
        remoteNode.nametag.inFrustum = true;
      } else {
        remoteNode.nametag.screenX = NaN;
        remoteNode.nametag.screenY = NaN;
        remoteNode.nametag.distanceFromCamera = dist;
        remoteNode.nametag.inFrustum = false;
      }
    }
  }
}

export function addNametag(ctx: GameState, height: number, node: RemoteNode) {
  const nametag = addEntity(ctx.world);
  const nametagNode = addRemoteNodeComponent(ctx, nametag);
  addComponent(ctx.world, NametagComponent, nametag);
  nametagNode.position.set([0, height + height / 1.5, 0]);
  addChild(node, nametagNode);
  NametagComponent.entity[nametag] = node.resourceId;
}

export function getNametag(ctx: GameState, node: RemoteNode) {
  const nametag = findChild(node, (child) => hasComponent(ctx.world, NametagComponent, node.resourceId));
  if (!nametag) throw new Error("avatar not found for entity " + node.name);
  return nametag;
}
