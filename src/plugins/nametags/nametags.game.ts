import { addComponent, defineComponent, defineQuery, hasComponent } from "bitecs";
import { mat4, vec3 } from "gl-matrix";
import { radToDeg } from "three/src/math/MathUtils";

import { addChild, findChild } from "../../engine/component/transform";
import { getForwardVector, getPitch, getYaw } from "../../engine/component/math";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../../engine/module/module.common";
import { projectPerspective } from "../../engine/camera/camera.game";
import { RendererModule } from "../../engine/renderer/renderer.game";
import { NametagsEnableMessage, NametagsEnableMessageType } from "./nametags.common";
import { ourPlayerQuery } from "../../engine/component/Player";
import { getRemoteResource, tryGetRemoteResource } from "../../engine/resource/resource.game";
import { RemoteNametag, RemoteNode } from "../../engine/resource/RemoteResources";

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

export const NametagAnchor = defineComponent();

const nametagAnchorQuery = defineQuery([NametagAnchor]);

const _v = vec3.create();
const _t = vec3.create();
const _forward = vec3.create();

export function NametagSystem(ctx: GameState) {
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
      const projected = projectPerspective(ctx, ctx.worldResource.activeCameraNode, nametagWorldPosition);

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

export function addNametag(ctx: GameState, height: number, node: RemoteNode, label: string) {
  const nametag = new RemoteNode(ctx.resourceManager, {
    position: [0, height * 2 + 1, 0],
    nametag: new RemoteNametag(ctx.resourceManager, {
      name: label,
    }),
  });
  addComponent(ctx.world, NametagAnchor, nametag.eid);
  addChild(node, nametag);
  return nametag;
}

export function getNametag(ctx: GameState, parent: RemoteNode) {
  const nametag = findChild(parent, (child) => hasComponent(ctx.world, NametagAnchor, child.eid));
  if (!nametag) throw new Error("avatar not found for entity " + parent.eid);
  return nametag;
}
