import { vec3 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { RaycastResultsMessage, WorkerMessageType } from "../WorkerMessage";
import { RaycastResult, RayId } from "./raycaster.common";

/*********
 * Types *
 ********/

export interface RaycasterModuleState {
  messages: RaycastResultsMessage[];
  results: Map<number, RaycastResult[]>;
}

/******************
 * Initialization *
 *****************/

export const RaycasterModule = defineModule<GameState, RaycasterModuleState>({
  name: "raycaster",
  create() {
    return {
      messages: [],
      results: new Map(),
    };
  },
  init(state) {
    registerMessageHandler(state, WorkerMessageType.RaycastResults, onRaycasterMessage);
  },
});

/********************
 * Message Handlers *
 *******************/

function onRaycasterMessage(state: GameState, message: RaycastResultsMessage) {
  const raycaster = getModule(state, RaycasterModule);
  raycaster.messages.push(message);
}

/***********
 * Systems *
 **********/

export function RaycasterSystem(state: GameState) {
  const raycaster = getModule(state, RaycasterModule);
  raycaster.results.clear();

  while (raycaster.messages.length) {
    const msg = raycaster.messages.pop();

    if (msg) {
      raycaster.results.set(msg.rayId, msg.results);
    }
  }
}

/*******
 * API *
 ******/

let nextRayId = 0;

export function createRay(): RayId {
  return nextRayId++;
}

export function raycast(state: GameState, rayId: RayId, origin: vec3, direction: vec3): void {
  // TODO: Improve raycast perf by using a SharedArrayBuffer
  state.renderPort.postMessage({
    type: WorkerMessageType.Raycast,
    rayId,
    origin,
    direction,
  });
}

export function getRaycastResults(state: GameState, rayId: RayId): RaycastResult[] | undefined {
  const raycaster = getModule(state, RaycasterModule);
  return raycaster.results.get(rayId);
}
