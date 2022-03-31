import { vec2 } from "gl-matrix";

import { GameState, GameInputState } from "../GameWorker";
import { InputObjectType } from "./InputKeys";

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
  path: keyof InputObjectType;
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
  x: keyof InputObjectType;
  y: keyof InputObjectType;
}

export interface ButtonBinding extends ActionBinding {
  type: BindingType.Button;
  path: keyof InputObjectType;
}

export interface DirectionalButtonsBinding extends ActionBinding {
  type: BindingType.DirectionalButtons;
  up: keyof InputObjectType;
  down: keyof InputObjectType;
  left: keyof InputObjectType;
  right: keyof InputObjectType;
}

export type ActionBindingTypes =
  | AxesBinding
  | ButtonBinding
  | DirectionalButtonsBinding
  | ActionBinding;

const ActionTypesToBindings: {
  [key: string]: {
    create: () => any;
    bindings: {
      [key: string]: (
        input: GameInputState,
        path: keyof InputObjectType,
        bindingDef: ActionBinding,
      ) => void;
    };
  };
} = {
  [ActionType.Button]: {
    create: () => ({ pressed: false, released: false, held: false }),
    bindings: {
      [BindingType.Button]: (
        input: GameInputState,
        path: keyof InputObjectType,
        bindingDef: ActionBinding,
      ) => {
        const down = input.raw[path];
        const value = input.actions.get(path) as ButtonActionState;
        
        value.pressed = !value.held && !!down;
        value.released = value.held && !down;
        value.held = !!down;
      },
    },
  },
  [ActionType.Vector2]: {
    create: () => vec2.create(),
    bindings: {
      [BindingType.Axes]: (
        input: GameInputState,
        path: keyof InputObjectType,
        bindingDef: ActionBinding,
      ) => {
        const { x, y } = bindingDef as AxesBinding;
        const value = input.actions.get(path) as vec2;
        value[0] = input.raw[x] || 0;
        value[1] = input.raw[y] || 0;
      },
      [BindingType.DirectionalButtons]: (
        input: GameInputState,
        path: keyof InputObjectType,
        bindingDef: ActionBinding,
      ) => {
        const { up, down, left, right } =
          bindingDef as DirectionalButtonsBinding;

        let x = 0;
        let y = 0;

        if (input.raw[up]) {
          y += 1;
        }

        if (input.raw[down]) {
          y -= 1;
        }

        if (input.raw[left]) {
          x -= 1;
        }

        if (input.raw[right]) {
          x += 1;
        }

        const value = input.actions.get(path) as vec2;
        value[0] = x;
        value[1] = y;
      },
    },
  },
};

export function ActionMappingSystem(state: GameState) {
  // Note not optimized at all
  for (const actionMap of state.input.actionMaps) {
    for (const action of actionMap.actions) {
      if (!state.input.actions.has(action.path)) {
        state.input.actions.set(
          action.path,
          ActionTypesToBindings[action.type].create()
        );
      }

      for (const binding of action.bindings) {
        ActionTypesToBindings[action.type].bindings[binding.type](
          state.input,
          action.path,
          binding,
        );
      }
    }
  }

  return state;
}
