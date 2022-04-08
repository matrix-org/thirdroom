import { hasComponent } from "bitecs";

import { GLTFComponentDescription, GLTFEntityDescription } from ".";
import { Renderable } from "../component/renderable";
import { getChildren, Transform } from "../component/transform";
import { GameState } from "../GameWorker";
import { ExportGLTFMessage, WorkerMessageType } from "../WorkerMessage";

function serializeEntity(state: GameState, eid: number): GLTFEntityDescription {
  const children: any[] = [];

  for (const childEid of getChildren(eid)) {
    children.push(serializeEntity(state, childEid));
  }

  const components: GLTFComponentDescription[] = [];

  components.push({
    type: "transform",
    position: Transform.position[eid],
    quaternion: Transform.quaternion[eid],
    scale: Transform.scale[eid],
  });

  if (hasComponent(state.world, Renderable, eid)) {
    components.push({
      type: "renderable",
      resourceId: Renderable.resourceId[eid],
    });
  }

  return {
    components,
    children,
  };
}

export function exportGLTF(state: GameState, rootEid: number) {
  state.renderer.port.postMessage({
    type: WorkerMessageType.ExportGLTF,
    scene: serializeEntity(state, rootEid),
  } as ExportGLTFMessage);
}
