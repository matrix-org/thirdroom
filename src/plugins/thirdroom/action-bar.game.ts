import { ourPlayerQuery } from "../../engine/player/Player";
import { GameContext } from "../../engine/GameTypes";
import { ActionMap, ActionDefinition, ActionType, BindingType, ButtonActionState } from "../../engine/input/ActionMap";
import { GameInputModule, InputModule } from "../../engine/input/input.game";
import { XRAvatarRig } from "../../engine/input/WebXRAvatarRigSystem";
import { getModule, Thread } from "../../engine/module/module.common";
import { getCamera } from "../../engine/player/getCamera";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { tryGetRemoteResource } from "../../engine/resource/resource.game";
import { ScriptComponent, scriptQuery } from "../../engine/scripting/scripting.game";
import { spawnPrefab } from "../spawnables/spawnables.game";
import { ActionBarItem, SetActionBarItemsMessage, ThirdRoomMessageType } from "./thirdroom.common";
import { ThirdRoomModule } from "./thirdroom.game";

export const actionBarMap: ActionMap = {
  id: "action-bar",
  actionDefs: [],
};

for (let i = 0; i < 10; i++) {
  const actionDef: ActionDefinition = {
    id: `action-bar-${i}`,
    path: `ActionBar/${i}`,
    type: ActionType.Button,
    bindings: [
      {
        type: BindingType.Button,
        path: `Keyboard/Digit${i}`,
      },
    ],
  };

  if (i === 1) {
    actionDef.bindings.push({
      type: BindingType.Button,
      path: `XRInputSource/primary/a-button`,
    });
  }

  actionBarMap.actionDefs.push(actionDef);
}

export const defaultActionBarItems: ActionBarItem[] = [
  {
    id: "small-crate",
    label: "Small Crate",
    thumbnail: "/image/small-crate-icon.png",
    spawnable: true,
  },
  {
    id: "medium-crate",
    label: "Medium Crate",
    thumbnail: "/image/medium-crate-icon.png",
    spawnable: true,
  },
  {
    id: "large-crate",
    label: "Large Crate",
    thumbnail: "/image/large-crate-icon.png",
    spawnable: true,
  },
  {
    id: "mirror-ball",
    label: "Mirror Ball",
    thumbnail: "/image/mirror-ball-icon.png",
    spawnable: true,
  },
  {
    id: "black-mirror-ball",
    label: "Black Mirror Ball",
    thumbnail: "/image/black-mirror-ball-icon.png",
    spawnable: true,
  },
  {
    id: "emissive-ball",
    label: "Emissive Ball",
    thumbnail: "/image/emissive-ball-icon.png",
    spawnable: true,
  },
];

export function setDefaultActionBarItems(ctx: GameContext) {
  const thirdroom = getModule(ctx, ThirdRoomModule);

  thirdroom.actionBarItems.length = 0;
  thirdroom.actionBarItems.push(...defaultActionBarItems);

  ctx.sendMessage<SetActionBarItemsMessage>(Thread.Main, {
    type: ThirdRoomMessageType.SetActionBarItems,
    actionBarItems: thirdroom.actionBarItems,
  });
}

export function ActionBarSystem(ctx: GameContext) {
  const input = getModule(ctx, InputModule);
  const { actionBarItems } = getModule(ctx, ThirdRoomModule);

  const scripts = scriptQuery(ctx.world);

  processPressedActionBarActions(actionBarItems, input, (actionBarItem) => {
    for (let i = 0; i < scripts.length; i++) {
      const script = ScriptComponent.get(scripts[i]);

      if (!script) {
        continue;
      }
      const actionBarListeners = script.wasmCtx.resourceManager.actionBarListeners;

      for (let l = 0; l < actionBarListeners.length; l++) {
        const listener = actionBarListeners[l];
        listener.actions.push(actionBarItem.id);
      }
    }
  });

  const eid = ourPlayerQuery(ctx.world)[0];

  if (eid) {
    const node = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const xr = XRAvatarRig.get(eid);

    processPressedActionBarActions(actionBarItems, input, (actionBarItem) => {
      if (actionBarItem.spawnable !== true) {
        return;
      }

      if (xr && xr.rightRayEid) {
        const rightRayNode = tryGetRemoteResource<RemoteNode>(ctx, xr.rightRayEid);
        return spawnPrefab(ctx, rightRayNode, actionBarItem.id, true);
      } else {
        const camera = getCamera(ctx, node).parent;

        if (camera) {
          return spawnPrefab(ctx, camera, actionBarItem.id, true);
        }
      }
    });
  }
}

function processPressedActionBarActions(
  actionBarItems: ActionBarItem[],
  input: GameInputModule,
  callback: (item: ActionBarItem) => boolean | void
) {
  for (let i = 0; i < actionBarMap.actionDefs.length; i++) {
    const actionDef = actionBarMap.actionDefs[i];
    const action = input.actionStates.get(actionDef.path) as ButtonActionState | undefined;

    if (action?.pressed) {
      const itemIndex = i === 0 ? 9 : i - 1;
      const actionBarItem = actionBarItems[itemIndex];

      if (!actionBarItem) {
        continue;
      }

      // Early out if the callback returns false
      // spawnPrefab returns false if the prefab cannot be spawned due to object cap.
      if (callback(actionBarItem) === false) {
        return;
      }
    }
  }
}
