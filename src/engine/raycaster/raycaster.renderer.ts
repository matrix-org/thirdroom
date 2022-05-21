import { Event, Intersection, Object3D, Raycaster } from "three";

import { RenderThreadState } from "../RenderWorker";
import { RaycastMessage, RaycastResultsMessage, WorkerMessageType } from "../WorkerMessage";
import { RaycastResult } from "./raycaster.common";

export interface RendererRaycasterState {
  raycaster: Raycaster;
  messages: RaycastMessage[];
}

export function initRendererRaycasterState(): RendererRaycasterState {
  return {
    raycaster: new Raycaster(),
    messages: [],
  };
}

export function initRendererRaycaster(state: RenderThreadState) {
  state.messageHandlers[WorkerMessageType.Raycast] = onRaycastMessage;
  state.preSystems.push(RendererRaycasterSystem);
}

function onRaycastMessage(state: RenderThreadState, message: RaycastMessage) {
  state.raycaster.messages.push(message);
}

const intersections: Intersection<Object3D<Event>>[] = [];

function RendererRaycasterSystem(state: RenderThreadState) {
  while (state.raycaster.messages.length) {
    const msg = state.raycaster.messages.pop();

    if (msg) {
      state.raycaster.raycaster.ray.origin.fromArray(msg.origin);
      state.raycaster.raycaster.ray.direction.fromArray(msg.direction);
      state.raycaster.raycaster.intersectObject(state.scene, true, intersections);

      const results: RaycastResult[] = [];

      while (intersections.length) {
        const intersection = intersections.pop();

        if (intersection) {
          const entity = state.objectToEntityMap.get(intersection.object);

          if (entity !== undefined) {
            results.push({
              entity,
              point: intersection.point.toArray(),
              distance: intersection.distance,
            });
          }
        }
      }

      state.gameWorkerMessageTarget.postMessage({
        type: WorkerMessageType.RaycastResults,
        rayId: msg.rayId,
        results,
      } as RaycastResultsMessage);
    }
  }
}
