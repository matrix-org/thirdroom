import { addComponent, hasComponent, IComponent } from "bitecs";

import { WorkerMessageType } from "../WorkerMessage";
import { traverse } from "./transform";
import { GameState, World } from "../GameTypes";
import { createObjectBufferView } from "../allocator/ObjectBufferView";
import { renderableSchema } from "./renderable.common";
import { getActiveScene } from "../renderer/renderer.game";

export interface Renderable extends IComponent {
  resourceId: Uint32Array;
  interpolate: Uint8Array;
  visible: Uint8Array;
}

export const renderableObjectBufferView = createObjectBufferView(renderableSchema, ArrayBuffer);

export const Renderable: Renderable = renderableObjectBufferView;

export function addRenderableComponent({ world, renderPort }: GameState, eid: number, resourceId: number) {
  addComponent(world, Renderable, eid);
  Renderable.interpolate[eid] = 1;
  Renderable.resourceId[eid] = resourceId;
  renderPort.postMessage({ type: WorkerMessageType.AddRenderable, eid, resourceId });
}

export function resetVisible(world: World, rootEid: number) {
  Renderable.visible.fill(0);

  traverse(rootEid, (eid) => {
    if (hasComponent(world, Renderable, eid)) {
      Renderable.visible[eid] = 1;
    }
  });
}

export function RenderableVisibilitySystem(state: GameState) {
  const scene = getActiveScene(state);
  resetVisible(state.world, scene);
}
