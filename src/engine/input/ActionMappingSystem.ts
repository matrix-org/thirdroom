import { vec2 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { GameNetworkState, NetworkModule } from "../network/network.game";
import {
  ActionBindingTypes,
  ActionDefinition,
  ActionMap,
  ActionState,
  ActionType,
  BindingType,
  ButtonActionState,
} from "./ActionMap";
import { InputModule } from "./input.game";
import { InputController } from "./InputController";

export interface Action<A extends ActionState> {
  create: () => A;
  reduce(input: InputController, bindings: ActionBindingTypes[], state: A): void;
}

function defineActionType<A>(actionDef: A): A {
  return actionDef;
}

export const ActionTypesToBindings = {
  [ActionType.Button]: defineActionType({
    /**
     * binary format
     * pressed:   0b001
     * released:  0b010
     * held:      0b100
     */
    create: () => ({ pressed: false, released: false, held: false }),
    reduce: (controller: InputController, bindings: ActionBindingTypes[], state: ButtonActionState) => {
      // TODO: In WebXR the pressed/release state doesn't work correctly.
      // It changes back and forth between pressed and released.
      let down = false;

      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];

        if (binding.type === BindingType.Button) {
          down = down || !!controller.raw[binding.path];
        }
      }

      // TODO: only send changed actions (current change detection does not send the zeroed out states)
      // const changed =
      //   pressed !== actionState.pressed || released !== actionState.released || held !== actionState.held;

      state.pressed = !state.held && down;
      state.released = state.held && !down;
      state.held = down;
    },
  }),
  [ActionType.Vector2]: defineActionType({
    create: () => vec2.create(),
    reduce: (controller: InputController, bindings: ActionBindingTypes[], state: vec2) => {
      let x = 0;
      let y = 0;

      for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];

        if (binding.type === BindingType.Axes) {
          if (binding.x) {
            x = controller.raw[binding.x] || 0;
          }

          if (binding.y) {
            y = controller.raw[binding.y] || 0;
          }

          // const changed = rawX ? rawX !== actionState[0] : false || rawY ? rawY !== actionState[1] : false;
        } else if (binding.type === BindingType.DirectionalButtons) {
          if (controller.raw[binding.up]) {
            y += 1;
          }

          if (controller.raw[binding.down]) {
            y -= 1;
          }

          if (controller.raw[binding.left]) {
            x -= 1;
          }

          if (controller.raw[binding.right]) {
            x += 1;
          }

          // const changed = x !== actionState[0] || y !== actionState[1];
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

// Note not optimized at all
function updateActionMaps(ctx: GameState, network: GameNetworkState, controller: InputController) {
  for (let i = 0; i < controller.actionMaps.length; i++) {
    const actionMap = controller.actionMaps[i];

    for (let j = 0; j < actionMap.actionDefs.length; j++) {
      const actionDef = actionMap.actionDefs[j];

      const action = ActionTypesToBindings[actionDef.type];
      const actionState = controller.actionStates.get(actionDef.path);

      if (actionState) {
        action.reduce(controller, actionDef.bindings, actionState as any);
      }
    }
  }
}

export function ActionMappingSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const input = getModule(ctx, InputModule);
  updateActionMaps(ctx, network, input.activeController);
}

export function initializeActionMap(controller: InputController, actionDef: ActionDefinition) {}

export function enableActionMap(controller: InputController, actionMap: ActionMap) {
  const index = controller.actionMaps.indexOf(actionMap);
  if (index === -1) {
    controller.actionMaps.push(actionMap);

    for (const actionDef of actionMap.actionDefs) {
      controller.actionStates.set(actionDef.path, ActionTypesToBindings[actionDef.type].create());
      // set ID maps for serialization
      controller.pathToId.set(actionDef.path, controller.actionStates.size);
      controller.pathToDef.set(actionDef.path, actionDef);
      controller.idToPath.set(controller.actionStates.size, actionDef.path);
    }
  }
}

export function disableActionMap(controller: InputController, actionMap: ActionMap) {
  const index = controller.actionMaps.indexOf(actionMap);
  if (index !== -1) {
    for (const actionDef of actionMap.actionDefs) {
      controller.actionStates.delete(actionDef.path);
      const id = controller.pathToId.get(actionDef.path) as number;
      controller.pathToId.delete(actionDef.path);
      controller.pathToDef.delete(actionDef.path);
      controller.idToPath.delete(id);
    }

    controller.actionMaps.splice(index, 1);
  }
}
