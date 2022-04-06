import { addEntity, defineQuery, removeComponent } from "bitecs";

import { ResourceState } from "../resources/ResourceManager";
import {
  addChild,
  addTransformComponent,
  setQuaternionFromEuler,
  Transform,
  updateMatrix,
} from "../component/transform";
import { GameState } from "../GameWorker";
import { addRenderableComponent } from "../component/renderable";
import { GLTFEntityDescription, RemoteGLTF } from ".";
import { GLTFLoader } from "./GLTFLoader";
import { RemoteResourceInfo } from "../resources/RemoteResourceManager";

function inflateGLTF(state: GameState, entity: GLTFEntityDescription, parentEid?: number) {
  const { world } = state;
  const eid = addEntity(world);

  for (const component of entity.components) {
    switch (component.type) {
      case "transform":
        addTransformComponent(world, eid);
        Transform.position[eid].set(component.position);
        Transform.rotation[eid].set(component.rotation);
        Transform.scale[eid].set(component.scale);
        setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);
        updateMatrix(eid);

        if (parentEid !== undefined) {
          addChild(parentEid, eid);
        }
        break;
      case "renderable":
        addRenderableComponent(state, eid, component.resourceId);
        break;
    }
  }

  if (entity.children) {
    for (const child of entity.children) {
      inflateGLTF(state, child, eid);
    }
  }

  return eid;
}

export const gltfQuery = defineQuery([GLTFLoader]);

export function GLTFLoaderSystem(state: GameState) {
  const { world, resourceManager } = state;
  const entities = gltfQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const resourceId = GLTFLoader.resourceId[eid];
    const resourceInfo = resourceManager.store.get(resourceId) as RemoteResourceInfo<RemoteGLTF>;

    if (resourceInfo.state === ResourceState.Loaded && resourceInfo.remoteResource) {
      inflateGLTF(state, resourceInfo.remoteResource.scene, eid);
      removeComponent(world, GLTFLoader, eid);
    }
  }
}
