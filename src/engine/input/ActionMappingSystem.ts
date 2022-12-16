import { vec2 } from "gl-matrix";

import {
  createCursorView,
  moveCursorView,
  readFloat32,
  readUint8,
  sliceCursorView,
  writeFloat32,
  writeUint8,
} from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { isHost } from "../network/network.common";
import { GameNetworkState, NetworkModule } from "../network/network.game";
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
  actionDefs: ActionDefinition[];
}

export interface ActionDefinition {
  id: string;
  path: string;
  type: ActionType;
  bindings: ActionBindingTypes[];
  networked?: boolean;
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

export interface Action {
  create: () => any;
  bindings: {
    [key: string]: (input: InputController, path: string, bindingDef: ActionBinding) => ActionState | false;
  };
  encode: (actionState: ActionState) => ArrayBuffer;
  decode: (buffer: ArrayBuffer) => ActionState;
}

export interface ActionTypesSchema {
  [key: string]: Action;
}

const writeView = createCursorView(new ArrayBuffer(1000));
export const ActionTypesToBindings: ActionTypesSchema = {
  [ActionType.Button]: {
    /**
     * binary format
     * pressed:   0b001
     * released:  0b010
     * held:      0b100
     */
    create: () => ({ pressed: false, released: false, held: false }),
    encode: (actionState: ActionState) => {
      moveCursorView(writeView, 0);
      actionState = actionState as ButtonActionState;
      let mask = 0;
      mask |= (actionState.pressed ? 1 : 0) << 0;
      mask |= (actionState.released ? 1 : 0) << 1;
      mask |= (actionState.held ? 1 : 0) << 2;
      writeUint8(writeView, mask);
      return sliceCursorView(writeView);
    },
    decode: (buffer: ArrayBuffer) => {
      const readView = createCursorView(buffer);
      const mask = readUint8(readView);
      const pressed = (mask & (1 << 0)) !== 0;
      const released = (mask & (1 << 1)) !== 0;
      const held = (mask & (1 << 2)) !== 0;
      return {
        pressed,
        released,
        held,
      } as ButtonActionState;
    },
    bindings: {
      [BindingType.Button]: (
        controller: InputController,
        path: string,
        bindingDef: ActionBinding
      ): ActionState | false => {
        const down = controller.raw[(bindingDef as any).path];
        const actionState = controller.actionStates.get(path) as ButtonActionState;

        const pressed = !actionState.held && !!down;
        const released = actionState.held && !down;
        const held = !!down;

        // TODO: only send changed actions (current change detection does not send the zeroed out states)
        // const changed =
        //   pressed !== actionState.pressed || released !== actionState.released || held !== actionState.held;

        actionState.pressed = pressed;
        actionState.released = released;
        actionState.held = held;

        return actionState;
        // return changed && actionState;
      },
    },
  },
  [ActionType.Vector2]: {
    create: () => vec2.create(),
    encode: (actionState: ActionState) => {
      moveCursorView(writeView, 0);
      actionState = actionState as vec2;
      writeFloat32(writeView, actionState[0]);
      writeFloat32(writeView, actionState[1]);
      return sliceCursorView(writeView);
    },
    decode: (buffer: ArrayBuffer) => {
      const readView = createCursorView(buffer);
      return [readFloat32(readView), readFloat32(readView)] as vec2;
    },
    bindings: {
      [BindingType.Axes]: (
        controller: InputController,
        path: string,
        bindingDef: ActionBinding
      ): ActionState | false => {
        const { x, y } = bindingDef as AxesBinding;
        const rawX = controller.raw[x];
        const rawY = controller.raw[y];

        const actionState = controller.actionStates.get(path) as vec2;

        // const changed = rawX ? rawX !== actionState[0] : false || rawY ? rawY !== actionState[1] : false;

        actionState[0] = rawX || 0;
        actionState[1] = rawY || 0;

        return actionState;
        // return changed && actionState;
      },
      [BindingType.DirectionalButtons]: (
        controller: InputController,
        path: string,
        bindingDef: ActionBinding
      ): ActionState | false => {
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

        const actionState = controller.actionStates.get(path) as vec2;

        // const changed = x !== actionState[0] || y !== actionState[1];

        actionState[0] = x;
        actionState[1] = y;

        return actionState;
        // return changed && actionState;
      },
    },
  },
};

export function ActionMappingSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const input = getModule(ctx, InputModule);
  for (const controller of input.controllers.values()) {
    updateActionMaps(ctx, network, controller);
  }

  // add a copy of all the actionStates for the active controller to the input history for reconciliation later
  const hosting = network.authoritative && isHost(network);
  if (!hosting) {
    input.activeController.history.push([ctx.tick, new Map(input.activeController.actionStates)]);
  }
}

// Note not optimized at all
function updateActionMaps(ctx: GameState, network: GameNetworkState, controller: InputController) {
  for (const actionMap of controller.actionMaps) {
    for (const actionDef of actionMap.actionDefs) {
      for (const binding of actionDef.bindings) {
        const action = ActionTypesToBindings[actionDef.type];
        const actionState = action.bindings[binding.type](controller, actionDef.path, binding);
        const shouldSendActionToHost = network.authoritative && !isHost(network) && actionDef.networked && actionState;
        if (shouldSendActionToHost) {
          const actionId = controller.pathToId.get(actionDef.path)!;
          network.commands.push([actionId, action.encode(actionState)]);
        }
      }
    }
  }
}

export function initializeActionMap(controller: InputController, actionDef: ActionDefinition) {
  controller.actionStates.set(actionDef.path, ActionTypesToBindings[actionDef.type].create());
  // set ID maps for serialization
  controller.pathToId.set(actionDef.path, controller.actionStates.size);
  controller.pathToDef.set(actionDef.path, actionDef);
  controller.idToPath.set(controller.actionStates.size, actionDef.path);
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
