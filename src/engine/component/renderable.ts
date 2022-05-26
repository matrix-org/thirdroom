import { addComponent, hasComponent, IComponent } from "bitecs";

import { renderableBuffer } from "./buffers";
import { addView } from "../allocator/CursorBuffer";
import { maxEntities } from "../config.common";
import { SetActiveCameraMessage, SetActiveSceneMessage, WorkerMessageType } from "../WorkerMessage";
import { traverse } from "./transform";
import { GameState, World } from "../GameTypes";
import { RendererModule } from "../renderer/renderer.game";
import { getModule } from "../module/module.common";

export interface Renderable extends IComponent {
  resourceId: Uint32Array;
  interpolate: Uint8Array;
  visible: Uint8Array;
}

export const Renderable: Renderable = {
  resourceId: addView(renderableBuffer, Uint32Array, maxEntities),
  interpolate: addView(renderableBuffer, Uint8Array, maxEntities),
  visible: addView(renderableBuffer, Uint8Array, maxEntities),
};

export function addRenderableComponent({ world, renderPort }: GameState, eid: number, resourceId: number) {
  addComponent(world, Renderable, eid);
  Renderable.interpolate[eid] = 1;
  Renderable.resourceId[eid] = resourceId;
  renderPort.postMessage({ type: WorkerMessageType.AddRenderable, eid, resourceId });
}

export function setActiveScene(state: GameState, eid: number, resourceId: number) {
  state.renderPort.postMessage({
    type: WorkerMessageType.SetActiveScene,
    eid,
    resourceId,
  } as SetActiveSceneMessage);
  state.scene = eid;
}

export function setActiveCamera(state: GameState, eid: number) {
  state.renderPort.postMessage({
    type: WorkerMessageType.SetActiveCamera,
    eid,
  } as SetActiveCameraMessage);
  state.camera = eid;
}

export function resetVisible(world: World, rootEid: number) {
  Renderable.visible.fill(0);

  traverse(rootEid, (eid) => {
    if (hasComponent(world, Renderable, eid)) {
      Renderable.visible[eid] = 1;
    }
  });
}

export function RenderableVisibilitySystem({ world, scene }: GameState) {
  resetVisible(world, scene);
}
