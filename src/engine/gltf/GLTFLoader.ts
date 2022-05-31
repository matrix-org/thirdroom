import { addComponent, addEntity, defineComponent, Types } from "bitecs";

import { GameState } from "../GameTypes";
import { loadRemoteResource } from "../resources/RemoteResourceManager";
import { addChild, addTransformComponent } from "../component/transform";
import { RendererModule } from "../renderer/renderer.game";
import { getModule } from "../module/module.common";

export const GLTFLoader = defineComponent({
  resourceId: Types.ui32,
});

export function addGLTFLoaderComponent(state: GameState, eid: number, url: string) {
  const { resourceManager } = getModule(state, RendererModule);
  const resourceId = loadRemoteResource(resourceManager, {
    type: "gltf",
    url,
  });

  addComponent(state.world, GLTFLoader, eid);
  GLTFLoader.resourceId[eid] = resourceId;
}

export function createGLTFEntity(state: GameState, url: string, parentEid?: number) {
  const { world } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);
  addGLTFLoaderComponent(state, eid, url);

  if (parentEid !== undefined) {
    addChild(parentEid, eid);
  }

  return eid;
}
