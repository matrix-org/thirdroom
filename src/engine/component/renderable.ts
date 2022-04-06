import { addComponent, IComponent } from "bitecs";

import { renderableBuffer } from ".";
import { addView } from "../allocator/CursorBuffer";
import { maxEntities } from "../config";
import { GameState } from "../GameWorker";
import { SetActiveCameraMessage, SetActiveSceneMessage, WorkerMessageType } from "../WorkerMessage";

export interface Renderable extends IComponent {
  resourceId: Uint32Array;
  interpolate: Uint8Array;
}

export const Renderable: Renderable = {
  resourceId: addView(renderableBuffer, Uint32Array, maxEntities),
  interpolate: addView(renderableBuffer, Uint8Array, maxEntities),
};

export function addRenderableComponent({ world, renderer: { port } }: GameState, eid: number, resourceId: number) {
  addComponent(world, Renderable, eid);
  Renderable.interpolate[eid] = 1;
  Renderable.resourceId[eid] = resourceId;
  port.postMessage({ type: WorkerMessageType.AddRenderable, eid, resourceId });
}

export function setActiveScene(state: GameState, eid: number) {
  state.renderer.port.postMessage({
    type: WorkerMessageType.SetActiveScene,
    eid,
  } as SetActiveSceneMessage);
  state.scene = eid;
}

export function setActiveCamera(state: GameState, eid: number) {
  state.renderer.port.postMessage({
    type: WorkerMessageType.SetActiveCamera,
    eid,
  } as SetActiveCameraMessage);
  state.camera = eid;
}
