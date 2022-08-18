import { defineComponent, defineQuery, Types } from "bitecs";
import { mat4, vec2, vec3 } from "gl-matrix";
import { radToDeg } from "three/src/math/MathUtils";

import { Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../../engine/module/module.common";
import { projectPerspective } from "../../engine/camera/camera.game";
import { NetworkModule, ownedPlayerQuery } from "../../engine/network/network.game";
import {
  NametagsEnableMessage,
  NametagsEnableMessageType,
  NametagsMessage,
  NametagsMessageType,
} from "./nametags.common";
import { RendererModule } from "../../engine/renderer/renderer.game";

// import { degToRad, radToDeg } from "three/src/math/MathUtils";
// import { RigidBody } from "../../engine/physics/physics.game";

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
});
const nametagQuery = defineQuery([NametagComponent]);

const _v = vec3.create();
const _forward = vec3.create();

export function NametagSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const renderer = getModule(ctx, RendererModule);
  const nametagModule = getModule(ctx, NametagModule);

  if (nametagModule.enabled) {
    const ourPlayer = ownedPlayerQuery(ctx.world)[0];
    const ourWorldPosition = Transform.position[ourPlayer];

    const nametagEnts = nametagQuery(ctx.world);
    const nametags: [string, vec2, number][] = [];
    for (let i = 0; i < nametagEnts.length; i++) {
      const nametag = nametagEnts[i];
      const otherPlayer = NametagComponent.entity[nametag];

      // projection to camera space
      const nametagWorldPosition = mat4.getTranslation(_v, Transform.worldMatrix[nametag]);
      const projected = projectPerspective(ctx, ctx.activeCamera, nametagWorldPosition);
      let peerId;
      for (const [p, e] of network.peerIdToEntityId.entries()) {
        if (otherPlayer === e) {
          peerId = p;
          break;
        }
      }

      if (!peerId) throw new Error("could not find peerId for entityId " + nametag);

      const dist = vec3.dist(nametagWorldPosition, ourWorldPosition);

      // TODO
      // const forward = getForwardVector(Transform.quaternion[ourPlayer])

      const [x, y, z, w] = Transform.quaternion[ourPlayer];
      const roll = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * y * y - 2 * z * z);
      const pitch = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * x * x - 2 * z * z);

      const forward = vec3.set(
        _forward,
        -Math.cos(pitch) * Math.sin(roll),
        Math.sin(pitch),
        -Math.cos(pitch) * Math.cos(roll)
      );

      const target = vec3.sub(vec3.create(), nametagWorldPosition, ourWorldPosition);
      vec3.normalize(target, target);

      const dot = vec3.dot(target, forward);
      const angle = radToDeg(Math.acos(dot));

      if (angle < 100) {
        // projection to screenspace
        const screenX = Math.round((0.5 + projected[0] / 2) * renderer.canvasWidth);
        const screenY = Math.round((0.5 - projected[1] / 2) * renderer.canvasHeight);
        nametags.push([peerId, [screenX, screenY] as vec2, dist]);
      }
    }
    if (nametags.length) console.log("YO");
    if (nametags.length)
      ctx.sendMessage<NametagsMessageType>(Thread.Main, {
        type: NametagsMessage,
        nametags,
      });
  }
}
