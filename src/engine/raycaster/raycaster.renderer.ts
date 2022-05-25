import { Event, Intersection, Object3D, Raycaster } from "three";

import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { IInitialRenderThreadState } from "../RenderTypes";
import { RenderThreadState } from "../RenderWorker";
import { RaycastMessage, RaycastResultsMessage, WorkerMessageType } from "../WorkerMessage";
import { RaycastResult } from "./raycaster.common";

export interface RendererRaycasterState {
  raycaster: Raycaster;
  messages: RaycastMessage[];
}

export const RaycasterModule = defineModule<RenderThreadState, IInitialRenderThreadState, RendererRaycasterState>({
  create() {
    return {
      raycaster: new Raycaster(),
      messages: [],
    };
  },
  init(state) {
    return registerMessageHandler(state, WorkerMessageType.Raycast, onRaycastMessage);
  },
});

function onRaycastMessage(state: RenderThreadState, message: RaycastMessage) {
  const raycasterState = getModule(state, RaycasterModule);
  raycasterState.messages.push(message);
}

const intersections: Intersection<Object3D<Event>>[] = [];

export function RendererRaycasterSystem(state: RenderThreadState) {
  const { scene, objectToEntityMap } = getModule(state, RendererModule);
  const raycasterState = getModule(state, RaycasterModule);

  while (raycasterState.messages.length) {
    const msg = raycasterState.messages.pop();

    if (msg) {
      raycasterState.raycaster.ray.origin.fromArray(msg.origin);
      raycasterState.raycaster.ray.direction.fromArray(msg.direction);
      raycasterState.raycaster.intersectObject(scene, true, intersections);

      const results: RaycastResult[] = [];

      while (intersections.length) {
        const intersection = intersections.pop();

        if (intersection) {
          const entity = objectToEntityMap.get(intersection.object);

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
