import { vec2, vec3 } from "gl-matrix";

import {
  createCursorView,
  moveCursorView,
  readFloat32,
  readUint8,
  sliceCursorView,
  writeFloat32,
  writeUint8,
} from "../allocator/CursorView";
import { ourPlayerQuery } from "../component/Player";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { isHost } from "../network/network.common";
import { GameNetworkState, NetworkModule } from "../network/network.game";
import { RigidBody } from "../physics/physics.game";
import { RemoteNode } from "../resource/RemoteResources";
import { getRemoteResource } from "../resource/resource.game";
import { addHistory } from "../utils/Historian";
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
  reduce(input: InputController, bindings: ActionBindingTypes[], state: A): A;
  encode: (actionState: ActionState) => ArrayBuffer;
  decode: (buffer: ArrayBuffer) => A;
}

function defineActionType<A>(actionDef: A): A {
  return actionDef;
}

const writeView = createCursorView(new ArrayBuffer(1000));

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

      for (const binding of bindings) {
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

      // return changed && actionState;
      return state;
    },
    encode: (actionState: ButtonActionState) => {
      moveCursorView(writeView, 0);
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
      };
    },
  }),
  [ActionType.Vector2]: defineActionType({
    create: () => vec2.create(),
    reduce: (controller: InputController, bindings: ActionBindingTypes[], state: vec2) => {
      let x = 0;
      let y = 0;

      for (const binding of bindings) {
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

      // return changed && actionState;
      return state;
    },
    encode: (actionState: vec2) => {
      moveCursorView(writeView, 0);
      writeFloat32(writeView, actionState[0]);
      writeFloat32(writeView, actionState[1]);
      return sliceCursorView(writeView);
    },
    decode: (buffer: ArrayBuffer) => {
      const readView = createCursorView(buffer);
      return [readFloat32(readView), readFloat32(readView)] as vec2;
    },
  }),
};

// Note not optimized at all
function updateActionMaps(ctx: GameState, network: GameNetworkState, controller: InputController) {
  for (const actionMap of controller.actionMaps) {
    for (const actionDef of actionMap.actionDefs) {
      const action = ActionTypesToBindings[actionDef.type];
      let actionState = controller.actionStates.get(actionDef.path);

      if (actionState) {
        actionState = action.reduce(controller, actionDef.bindings, actionState as any);
      }

      const shouldSendActionToHost = network.authoritative && !isHost(network) && actionDef.networked && actionState;

      if (shouldSendActionToHost) {
        const actionId = controller.pathToId.get(actionDef.path);

        if (actionId) {
          network.commands.push([ctx.tick, actionId, action.encode(actionState as any)]);
        }
      }
    }
  }
}

export function ActionMappingSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const input = getModule(ctx, InputModule);
  for (const controller of input.controllers.values()) {
    updateActionMaps(ctx, network, controller);
  }
}

export function ActionMapHistorianSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  // add a copy of all the actionStates for the active controller to the input history for reconciliation later
  const notHosting = network.authoritative && !isHost(network);
  if (notHosting) {
    const eid = ourPlayerQuery(ctx.world)[0];
    const node = getRemoteResource<RemoteNode>(ctx, eid);
    const body = RigidBody.store.get(eid);
    if (!eid || !node || !body) {
      return;
    }

    const vel = body.linvel();

    addHistory(input.activeController.outbound, ctx.tick, [
      // TODO: new Map creates needless garbage, add pooling here
      new Map(input.activeController.actionStates),
      { position: vec3.clone(node.position), velocity: vec3.set(vec3.create(), vel.x, vel.y, vel.z) },
    ]);
  }
}

// export function DrainClientInputQueueSystem(ctx: GameState) {
//   const input = getModule(ctx, InputModule);
//   const network = getModule(ctx, NetworkModule);

//   const hosting = network.authoritative && isHost(network);
//   if (hosting) {
//     // iterate all controllers
//     const ents = inputControllerQuery(ctx.world);
//     for (let i = 0; i < ents.length; i++) {
//       const eid = ents[i];
//       const controller = tryGetInputController(input, eid);
//       // drain input for client for the latest tick recieved by them
//       const [latestTick] = controller.inbound[0];
//       controller.inbound.forEach(([tick, actionState], i) => {
//         if (tick === latestTick) {
//           // controller.actionStates.set

//           controller.inbound.splice(i, 1);
//         }
//       });
//     }
//   }
// }

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
