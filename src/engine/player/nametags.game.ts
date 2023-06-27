import { addComponent, defineComponent, defineQuery, Types } from "bitecs";
import { mat4, vec3 } from "gl-matrix";
import { radToDeg } from "three/src/math/MathUtils";

import { addChild } from "../../engine/component/transform";
import { getForwardVector, getPitch, getYaw } from "../common/math";
import { GameContext } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { projectPerspective } from "../../engine/camera/camera.game";
import { RendererModule } from "../../engine/renderer/renderer.game";
import { NametagsEnableMessage, NametagsEnableMessageType } from "./nametags.common";
import { ourPlayerQuery } from "../../engine/player/Player";
import { getRemoteResource, tryGetRemoteResource } from "../../engine/resource/resource.game";
import { RemoteNametag, RemoteNode } from "../../engine/resource/RemoteResources";

type NametagState = {
  enabled: boolean;
};

export const NametagModule = defineModule<GameContext, NametagState>({
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

function onNametagsEnabledMessage(ctx: GameContext, message: NametagsEnableMessageType) {
  const nametagModule = getModule(ctx, NametagModule);
  nametagModule.enabled = message.enabled;
}

export const NametagAnchor = defineComponent();

export const NametagRef = defineComponent({ eid: Types.eid });

const nametagAnchorQuery = defineQuery([NametagAnchor]);

const _v = vec3.create();
const _t = vec3.create();
const _forward = vec3.create();

export function NametagSystem(ctx: GameContext) {
  const renderer = getModule(ctx, RendererModule);
  const nametagModule = getModule(ctx, NametagModule);
  const ourPlayerEid = ourPlayerQuery(ctx.world)[0];
  const ourPlayerNode = getRemoteResource<RemoteNode>(ctx, ourPlayerEid);

  if (nametagModule.enabled && ourPlayerNode) {
    const ourWorldPosition = ourPlayerNode.position;

    const nametagAchorEnts = nametagAnchorQuery(ctx.world);
    for (let i = 0; i < nametagAchorEnts.length; i++) {
      const anchorNode = tryGetRemoteResource<RemoteNode>(ctx, nametagAchorEnts[i]);

      if (!ctx.worldResource.activeCameraNode) {
        continue;
      }

      // projection to camera space
      const nametagWorldPosition = mat4.getTranslation(_v, anchorNode.worldMatrix);
      const projected = projectPerspective(renderer, ctx.worldResource.activeCameraNode, nametagWorldPosition);

      const dist = vec3.dist(nametagWorldPosition, ourWorldPosition);

      const quaternion = ourPlayerNode.quaternion;
      const pitch = getPitch(quaternion);
      const roll = getYaw(quaternion);
      const forward = getForwardVector(_forward, pitch, roll);

      const target = vec3.sub(_t, nametagWorldPosition, ourWorldPosition);
      vec3.normalize(target, target);

      const dot = vec3.dot(target, forward);
      const angle = radToDeg(Math.acos(dot));

      const nametag = anchorNode.nametag!;

      if (angle < 100) {
        // projection to screenspace
        const screenX = Math.round((0.5 + projected[0] / 2) * renderer.canvasWidth);
        const screenY = Math.round((0.5 - projected[1] / 2) * renderer.canvasHeight);

        nametag.screenX = screenX;
        nametag.screenY = screenY;
        nametag.distanceFromCamera = dist;
        nametag.inFrustum = true;
      } else {
        nametag.screenX = NaN;
        nametag.screenY = NaN;
        nametag.distanceFromCamera = dist;
        nametag.inFrustum = false;
      }
    }
  }
}

export function addNametag(ctx: GameContext, height: number, node: RemoteNode, label: string) {
  const nametag = new RemoteNode(ctx.resourceManager, {
    position: [0, height, 0],
    nametag: new RemoteNametag(ctx.resourceManager, {
      name: label,
    }),
  });
  addComponent(ctx.world, NametagAnchor, nametag.eid);
  addChild(node, nametag);
  addComponent(ctx.world, NametagRef, node.eid);
  NametagRef.eid[node.eid] = nametag.eid;
  return nametag;
}

export function getNametag(ctx: GameContext, parent: RemoteNode) {
  const nametagEid = NametagRef.eid[parent.eid];
  if (!nametagEid) throw new Error(`NametagRef not found on node "${parent.name}"`);
  const nametag = tryGetRemoteResource<RemoteNode>(ctx, nametagEid);
  return nametag;
}
