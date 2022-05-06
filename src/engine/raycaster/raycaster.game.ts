import { vec3 } from "gl-matrix";

import { GameState } from "../GameWorker";
import { RaycastResultsMessage, WorkerMessageType } from "../WorkerMessage";
import { RaycastResult, RayId } from "./raycaster.common";

export interface RaycasterState {
  messages: RaycastResultsMessage[];
  results: Map<number, RaycastResult[]>;
}

export function createRaycasterState(): RaycasterState {
  return {
    messages: [],
    results: new Map(),
  };
}

export function initRaycaster(state: GameState) {
  state.messageHandlers[WorkerMessageType.RaycastResults] = onRaycasterMessage;
  state.preSystems.push(RaycasterSystem);
}

function onRaycasterMessage(state: GameState, message: RaycastResultsMessage) {
  state.raycaster.messages.push(message);
}

function RaycasterSystem(state: GameState) {
  state.raycaster.results.clear();

  while (state.raycaster.messages.length) {
    const msg = state.raycaster.messages.pop();

    if (msg) {
      state.raycaster.results.set(msg.rayId, msg.results);
    }
  }
}

let nextRayId = 0;

export function createRay(): RayId {
  return nextRayId++;
}

export function raycast(state: GameState, rayId: RayId, origin: vec3, direction: vec3): void {
  // TODO: Improve raycast perf by using a SharedArrayBuffer
  state.renderer.port.postMessage({
    type: WorkerMessageType.Raycast,
    rayId,
    origin,
    direction,
  });
}

export function getRaycastResults(state: GameState, rayId: RayId): RaycastResult[] | undefined {
  return state.raycaster.results.get(rayId);
}
