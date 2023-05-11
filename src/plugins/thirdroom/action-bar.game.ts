import { GameState } from "../../engine/GameTypes";
import { ActionMap, ActionDefinition, ActionType, BindingType, ButtonActionState } from "../../engine/input/ActionMap";
import { InputModule } from "../../engine/input/input.game";
import { getModule } from "../../engine/module/module.common";
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
    networked: true,
  };

  if (i === 1) {
    actionDef.bindings.push({
      type: BindingType.Button,
      path: `XRInputSource/primary/a-button`,
    });
  }

  actionBarMap.actionDefs.push(actionDef);
}

export function ActionBarSystem(ctx: GameState) {
  const { actionBarItems, actionBarListeners } = getModule(ctx, ThirdRoomModule);
  const { activeController } = getModule(ctx, InputModule);

  for (let i = 0; i < actionBarMap.actionDefs.length; i++) {
    const actionDef = actionBarMap.actionDefs[i];
    const action = activeController.actionStates.get(actionDef.path) as ButtonActionState | undefined;

    if (action?.pressed) {
      const itemIndex = i === 0 ? 9 : i - 1;
      const actionBarItem = actionBarItems[itemIndex];

      if (!actionBarItem) {
        continue;
      }
      itemIndex;
      for (let l = 0; l < actionBarListeners.length; l++) {
        const listener = actionBarListeners[l];
        listener.actions.push(actionBarItem);
      }
    }
  }
}
