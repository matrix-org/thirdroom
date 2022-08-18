import { defineComponent, defineQuery, Types } from "bitecs";
import { mat4, vec2, vec3 } from "gl-matrix";

import { Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../../engine/input/ActionMappingSystem";
import { defineModule, getModule, Thread } from "../../engine/module/module.common";
import { InputModule } from "../../engine/input/input.game";
import { projectPerspective } from "../../engine/camera/camera.game";
import { NetworkModule, ownedPlayerQuery } from "../../engine/network/network.game";
import { NametagsMessage, NametagsMessageType } from "./nametags.common";
import { RendererModule } from "../../engine/renderer/renderer.game";

type NametagState = {
  show: boolean;
};

export const NametagModule = defineModule<GameState, NametagState>({
  name: "nametag",
  create() {
    return {
      show: false,
    };
  },
  init(ctx) {
    enableActionMap(ctx, ShowNametagsActionMap);
  },
});

export const ShowNametagsActionMap: ActionMap = {
  id: "toggle-nametags",
  actions: [
    {
      id: "toggleNametags",
      path: "ToggleNametags",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyN",
        },
      ],
    },
  ],
};

export const NametagComponent = defineComponent({
  entity: Types.eid,
});
const nametagQuery = defineQuery([NametagComponent]);

const _v = vec3.create();

export function NametagSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);
  const renderer = getModule(ctx, RendererModule);
  const nametagModule = getModule(ctx, NametagModule);

  const toggleNametags = input.actions.get("ToggleNametags") as ButtonActionState;
  if (toggleNametags.pressed) {
    nametagModule.show = !nametagModule.show;
  }

  if (nametagModule.show) {
    const ourPlayer = ownedPlayerQuery(ctx.world)[0];
    const ourWorldPosition = Transform.position[ourPlayer];

    const nametagEnts = nametagQuery(ctx.world);
    const nametags: [string, vec2, number][] = [];
    for (let i = 0; i < nametagEnts.length; i++) {
      const eid = nametagEnts[i];
      const player = NametagComponent.entity[eid];

      // projection to camera space
      const worldPosition = mat4.getTranslation(_v, Transform.worldMatrix[eid]);
      const projected = projectPerspective(ctx, ctx.activeCamera, worldPosition);
      let peerId;
      for (const [p, e] of network.peerIdToEntityId.entries()) {
        if (player === e) {
          peerId = p;
          break;
        }
      }

      if (!peerId) throw new Error("could not find peerId for entityId " + eid);

      const dist = vec3.dist(worldPosition, ourWorldPosition);

      // projection to screenspace
      const x = Math.round((0.5 + projected[0] / 2) * renderer.canvasWidth);
      const y = Math.round((0.5 - projected[1] / 2) * renderer.canvasHeight);
      nametags.push([peerId, [x, y] as vec2, dist]);
    }
    if (nametags.length)
      ctx.sendMessage<NametagsMessageType>(Thread.Main, {
        type: NametagsMessage,
        nametags,
      });
  }
}
