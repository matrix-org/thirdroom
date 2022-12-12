import { vec2 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { InputModule } from "./input.game";
import { InputController } from "./InputController";

export enum ActionType {
  Vector2 = "Vector2",
  Button = "Button",
}

export interface ButtonActionState {
  pressed: boolean;
  released: boolean;
  held: boolean;
}

export type ActionState = number | vec2 | ButtonActionState;

export interface ActionMap {
  id: string;
  actions: ActionDefinition[];
}

export interface ActionDefinition {
  id: string;
  path: string;
  type: ActionType;
  bindings: ActionBindingTypes[];
}

export enum BindingType {
  Axes = "Axes",
  Button = "Button",
  DirectionalButtons = "DirectionalButtons",
}

export interface ActionBinding {
  type: BindingType;
}

export interface AxesBinding extends ActionBinding {
  type: BindingType.Axes;
  x: string;
  y: string;
}

export interface ButtonBinding extends ActionBinding {
  type: BindingType.Button;
  path: string;
}

export interface DirectionalButtonsBinding extends ActionBinding {
  type: BindingType.DirectionalButtons;
  up: string;
  down: string;
  left: string;
  right: string;
}

export type ActionBindingTypes = AxesBinding | ButtonBinding | DirectionalButtonsBinding | ActionBinding;

const ActionTypesToBindings: {
  [key: string]: {
    create: () => any;
    bindings: {
      [key: string]: (input: InputController, path: string, bindingDef: ActionBinding) => void;
    };
  };
} = {
  [ActionType.Button]: {
    create: () => ({ pressed: false, released: false, held: false }),
    bindings: {
      [BindingType.Button]: (controller: InputController, path: string, bindingDef: ActionBinding) => {
        const down = controller.raw[(bindingDef as any).path];
        const value = controller.actions.get(path) as ButtonActionState;

        value.pressed = !value.held && !!down;
        value.released = value.held && !down;
        value.held = !!down;
      },
    },
  },
  [ActionType.Vector2]: {
    create: () => vec2.create(),
    bindings: {
      [BindingType.Axes]: (controller: InputController, path: string, bindingDef: ActionBinding) => {
        const { x, y } = bindingDef as AxesBinding;
        const value = controller.actions.get(path) as vec2;
        value[0] = controller.raw[x] || 0;
        value[1] = controller.raw[y] || 0;
      },
      [BindingType.DirectionalButtons]: (controller: InputController, path: string, bindingDef: ActionBinding) => {
        const { up, down, left, right } = bindingDef as DirectionalButtonsBinding;

        let x = 0;
        let y = 0;

        if (controller.raw[up]) {
          y += 1;
        }

        if (controller.raw[down]) {
          y -= 1;
        }

        if (controller.raw[left]) {
          x -= 1;
        }

        if (controller.raw[right]) {
          x += 1;
        }

        const value = controller.actions.get(path) as vec2;
        value[0] = x;
        value[1] = y;
      },
    },
  },
};

export function ActionMappingSystem(state: GameState) {
  const input = getModule(state, InputModule);
  for (const controller of input.controllers.values()) {
    updateActionMaps(controller);
  }
}

// Note not optimized at all
function updateActionMaps(controller: InputController) {
  for (const actionMap of controller.actionMaps) {
    for (const action of actionMap.actions) {
      if (!controller.actions.has(action.path)) {
        controller.actions.set(action.path, ActionTypesToBindings[action.type].create());
      }

      for (const binding of action.bindings) {
        ActionTypesToBindings[action.type].bindings[binding.type](controller, action.path, binding);
      }
    }
  }
}

export function enableActionMap(controller: InputController, actionMap: ActionMap) {
  const index = controller.actionMaps.indexOf(actionMap);
  if (index === -1) {
    controller.actionMaps.push(actionMap);
  }
}

export function disableActionMap(controller: InputController, actionMap: ActionMap) {
  const index = controller.actionMaps.indexOf(actionMap);
  if (index !== -1) {
    controller.actionMaps.splice(index, 1);
  }
}
