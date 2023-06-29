import { vec2 } from "gl-matrix";

import { GameContext } from "../GameTypes";
import { getModule } from "../module/module.common";
import { ActionBindingTypes, ActionMap, ActionState, ActionType, BindingType, ButtonActionState } from "./ActionMap";
import { GameInputModule, InputModule } from "./input.game";

export interface Action<A extends ActionState> {
  create: () => A;
  reduce(input: GameInputModule, bindings: ActionBindingTypes[], state: A): void;
}

function defineActionType<A>(actionDef: A): A {
  return actionDef;
}

export const ActionTypesToBindings = {
  [ActionType.Button]: defineActionType({
    create: () => ({ pressed: false, released: false, held: false }),
    reduce: (input: GameInputModule, bindings: ActionBindingTypes[], state: ButtonActionState) => {
      // TODO: In WebXR the pressed/release state doesn't work correctly.
      // It changes back and forth between pressed and released.
      let down = false;

      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];

        if (binding.type === BindingType.Button) {
          down = down || !!input.raw[binding.path];
        }
      }

      state.pressed = !state.held && down;
      state.released = state.held && !down;
      state.held = down;
    },
  }),
  [ActionType.Vector2]: defineActionType({
    create: () => vec2.create(),
    reduce: (input: GameInputModule, bindings: ActionBindingTypes[], state: vec2) => {
      let x = 0;
      let y = 0;

      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];

        if (binding.type === BindingType.Axes) {
          if (binding.x) {
            x = input.raw[binding.x] || 0;
          }

          if (binding.y) {
            y = input.raw[binding.y] || 0;
          }
        } else if (binding.type === BindingType.DirectionalButtons) {
          if (input.raw[binding.up]) {
            y += 1;
          }

          if (input.raw[binding.down]) {
            y -= 1;
          }

          if (input.raw[binding.left]) {
            x -= 1;
          }

          if (input.raw[binding.right]) {
            x += 1;
          }
        }

        if (x !== 0 || y !== 0) {
          break;
        }
      }

      state[0] = x;
      state[1] = y;
    },
  }),
};

export function ActionMappingSystem(ctx: GameContext) {
  const input = getModule(ctx, InputModule);

  // Note not optimized at all
  for (let i = 0; i < input.actionMaps.length; i++) {
    const actionMap = input.actionMaps[i];

    for (let j = 0; j < actionMap.actionDefs.length; j++) {
      const actionDef = actionMap.actionDefs[j];

      const action = ActionTypesToBindings[actionDef.type];
      const actionState = input.actionStates.get(actionDef.path);

      if (actionState) {
        action.reduce(input, actionDef.bindings, actionState as any);
      }
    }
  }
}

export function enableActionMap(input: GameInputModule, actionMap: ActionMap) {
  const index = input.actionMaps.indexOf(actionMap);
  if (index === -1) {
    input.actionMaps.push(actionMap);

    for (const actionDef of actionMap.actionDefs) {
      input.actionStates.set(actionDef.path, ActionTypesToBindings[actionDef.type].create());
    }
  }
}

export function disableActionMap(input: GameInputModule, actionMap: ActionMap) {
  const index = input.actionMaps.indexOf(actionMap);
  if (index !== -1) {
    for (const actionDef of actionMap.actionDefs) {
      input.actionStates.delete(actionDef.path);
    }

    input.actionMaps.splice(index, 1);
  }
}
