import { World } from "./World";
import { Vector2 } from "three";

export enum ActionType {
  Vector2 = "Vector2",
  Button = "Button",
}

export interface ButtonActionState {
  pressed: boolean;
  released: boolean;
  held: boolean;
}

export type ActionState = number | Vector2 | ButtonActionState;

export interface ActionMap {
  id: string;
  actions: ActionDefinition[];
}

interface ActionDefinition {
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

interface ActionBinding {
  type: BindingType;
}

interface AxesBinding extends ActionBinding {
  type: BindingType.Axes;
  x: string;
  y: string;
}

interface ButtonBinding extends ActionBinding {
  type: BindingType.Button;
  path: string;
}

interface DirectionalButtonsBinding extends ActionBinding {
  type: BindingType.DirectionalButtons;
  up: string;
  down: string;
  left: string;
  right: string;
}

type ActionBindingTypes =
  | AxesBinding
  | ButtonBinding
  | DirectionalButtonsBinding
  | ActionBinding;

const ActionTypesToBindings: {
  [key: string]: {
    create: () => any;
    bindings: {
      [key: string]: (
        path: string,
        bindingDef: ActionBinding,
        input: Map<string, number>,
        actions: Map<string, ActionState>
      ) => void;
    };
  };
} = {
  [ActionType.Button]: {
    create: () => ({ pressed: false, released: false, held: false }),
    bindings: {
      [BindingType.Button]: (
        path: string,
        bindingDef: ActionBinding,
        input: Map<string, number>,
        actions: Map<string, ActionState>
      ) => {
        const state = input.get((bindingDef as ButtonBinding).path);
        const value = actions.get(path) as ButtonActionState;
        value.pressed = !value.held && !!state;
        value.released = value.held && !state;
        value.held = !!state;
      },
    },
  },
  [ActionType.Vector2]: {
    create: () => new Vector2(),
    bindings: {
      [BindingType.Axes]: (
        path: string,
        bindingDef: ActionBinding,
        input: Map<string, number>,
        actions: Map<string, ActionState>
      ) => {
        const { x, y } = bindingDef as AxesBinding;
        const value = actions.get(path) as Vector2;
        value.set(input.get(x) || 0, input.get(y) || 0);
      },
      [BindingType.DirectionalButtons]: (
        path: string,
        bindingDef: ActionBinding,
        input: Map<string, number>,
        actions: Map<string, ActionState>
      ) => {
        const { up, down, left, right } =
          bindingDef as DirectionalButtonsBinding;

        let x = 0;
        let y = 0;

        if (input.get(up)) {
          y += 1;
        }

        if (input.get(down)) {
          y -= 1;
        }

        if (input.get(left)) {
          x -= 1;
        }

        if (input.get(right)) {
          x += 1;
        }

        const value = actions.get(path) as Vector2;
        value.set(x, y);
      },
    },
  },
};

interface InputModuleOptions {
  actionMaps?: ActionMap[];
  pointerLock?: boolean;
}

export function InputModule(world: World, options: InputModuleOptions) {
  world.input = new Map();
  world.actionMaps = options.actionMaps || [];
  world.actions = new Map();

  function onMouseDown() {
    world.renderer.domElement.requestPointerLock();
  }

  if (options.pointerLock) {
    world.renderer.domElement.addEventListener("mousedown", onMouseDown);
  }

  function onKeyDown(e: KeyboardEvent) {
    world.input.set(`Keyboard/${e.code}`, 1);
  }

  function onKeyUp(e: KeyboardEvent) {
    world.input.set(`Keyboard/${e.code}`, 0);
  }

  function onMouseMove(e: MouseEvent) {
    if (
      options.pointerLock &&
      document.pointerLockElement === world.renderer.domElement
    ) {
      world.input.set(
        "Mouse/movementX",
        world.input.get("Mouse/movementX")! + e.movementX
      );
      world.input.set(
        "Mouse/movementY",
        world.input.get("Mouse/movementY")! + e.movementY
      );
    }
  }

  function onBlur() {
    for (const key of world.input.keys()) {
      world.input.set(key, 0);
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("blur", onBlur);

  function ActionMappingSystem(world: World) {
    // Note not optimized at all
    for (const actionMap of world.actionMaps) {
      for (const action of actionMap.actions) {
        if (!world.actions.has(action.path)) {
          world.actions.set(
            action.path,
            ActionTypesToBindings[action.type].create()
          );
        }

        for (const binding of action.bindings) {
          ActionTypesToBindings[action.type].bindings[binding.type](
            action.path,
            binding,
            world.input,
            world.actions
          );
        }
      }
    }

    return world;
  }

  function InputResetSystem(world: World) {
    world.input.set("Mouse/movementX", 0);
    world.input.set("Mouse/movementY", 0);
    return world;
  }

  const dispose = () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("blur", onBlur);
    world.renderer.domElement.removeEventListener("mousedown", onMouseDown);
  };

  return {
    ActionMappingSystem,
    InputResetSystem,
    dispose,
  };
}
