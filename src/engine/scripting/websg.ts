import { GameState } from "../GameTypes";
import { IRemoteResourceClass, RemoteResourceConstructor } from "../resource/RemoteResourceClass";
import { getRemoteResources } from "../resource/resource.game";
import { readFloat32ArrayInto, readString, WASMModuleContext, writeFloat32Array } from "./WASMModuleContext";
import { RemoteLight, RemoteMesh, RemoteNode, RemoteScene } from "../resource/RemoteResources";
import { addChild, removeChild } from "../component/transform";
import { ResourceType } from "../resource/schema";

function getScriptResource<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  resourceId: number
): InstanceType<T> | undefined {
  const { resourceIds, resourceMap } = wasmCtx.resourceManager;
  const { name, resourceType } = resourceConstructor.resourceDef;

  if (!resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${name}: ${resourceId}`);
    return undefined;
  }

  const resource = resourceMap.get(resourceId) as InstanceType<T> | undefined;

  if (!resource) {
    console.error(`WebSG: missing ${name}: ${resourceId}`);
    return undefined;
  }

  if (resource.resourceType !== resourceType) {
    console.error(`WebSG: id does not point to a ${name}: ${resourceId}`);
    return undefined;
  }

  return resource;
}

function getScriptResourceByName<T extends RemoteResourceConstructor>(
  ctx: GameState,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  name: string
): InstanceType<T> | undefined {
  const resources = getRemoteResources(ctx, resourceConstructor as IRemoteResourceClass<T["resourceDef"]>);

  const resourceIds = wasmCtx.resourceManager.resourceIds;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    if (resource.name === name && resourceIds.has(resource.eid)) {
      return resource as InstanceType<T>;
    }
  }

  return undefined;
}

function getScriptResourceByNamePtr<T extends RemoteResourceConstructor>(
  ctx: GameState,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  namePtr: number,
  byteLength: number
): InstanceType<T> | undefined {
  const name = readString(wasmCtx, namePtr, byteLength);
  return getScriptResourceByName(ctx, wasmCtx, resourceConstructor, name);
}

function getScriptResourceRef<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  refResource: InstanceType<T> | undefined
): number {
  if (!refResource) {
    return 0;
  }

  const resourceId = refResource.eid;

  if (!wasmCtx.resourceManager.resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${resourceConstructor.name}: ${resourceId}`);
    return 0;
  }

  return resourceId;
}

function getScriptChildCount(wasmCtx: WASMModuleContext, node: RemoteNode | RemoteScene): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let count = 0;
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      count++;
    }

    cursor = cursor.nextSibling;
  }

  return count;
}

function getScriptChildren(
  wasmCtx: WASMModuleContext,
  node: RemoteNode | RemoteScene,
  nodeArrPtr: number,
  maxCount: number
): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;
  const U32Heap = wasmCtx.U32Heap;

  let i = 0;
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor && i < maxCount) {
    // Only write the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      U32Heap[nodeArrPtr / 4 + i] = cursor.eid;
      i++;
    }

    cursor = cursor.nextSibling;
  }

  // Return the number of ids written into the array
  return i;
}

function scriptGetChildAt(wasmCtx: WASMModuleContext, parent: RemoteNode | RemoteScene, index: number): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let i = 0;
  let cursor = parent.resourceType === ResourceType.Node ? parent.firstChild : parent.firstNode;

  while (cursor && i < index) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      i++;
    }

    cursor = cursor.nextSibling;
  }

  if (i === index && cursor && resourceIds.has(cursor.eid)) {
    return cursor.eid;
  }

  return 0;
}

// TODO: ResourceManager should have a resourceMap that corresponds to just its owned resources
// TODO: ResourceManager should have a resourceByType that corresponds to just its owned resources
// TODO: Force disposal of all entities belonging to the wasmCtx when environment unloads
// TODO: When do we update local / world matrices?

export function createWebSGModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  return {
    get_environment_scene() {
      return ctx.worldResource.environment?.publicScene.eid || 0;
    },
    set_environment_scene(sceneId: number) {
      if (!ctx.worldResource.environment) {
        console.error(`WebSG: environment not set`);
        return -1;
      }

      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (scene) {
        ctx.worldResource.environment.publicScene = scene;
        return 0;
      } else {
        return -1;
      }
    },
    create_scene() {
      try {
        return new RemoteScene(wasmCtx.resourceManager).eid;
      } catch (error) {
        console.error("WebSG: Error creating scene:", error);
        return 0;
      }
    },
    scene_find_by_name(namePtr: number, byteLength: number) {
      const scene = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteScene, namePtr, byteLength);
      return scene ? scene.eid : 0;
    },
    scene_add_node(sceneId: number, nodeId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      addChild(scene, node);

      return 0;
    },
    scene_remove_node(sceneId: number, nodeId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      removeChild(scene, node);

      return 0;
    },
    scene_node_count(sceneId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      return getScriptChildCount(wasmCtx, scene);
    },
    scene_get_nodes(sceneId: number, nodeArrPtr: number, maxCount: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      return getScriptChildren(wasmCtx, scene, nodeArrPtr, maxCount);
    },
    scene_get_node(sceneId: number, index: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      return scriptGetChildAt(wasmCtx, scene, index);
    },
    create_node() {
      try {
        return new RemoteNode(wasmCtx.resourceManager).eid;
      } catch (error) {
        console.error("WebSG: Error creating node:", error);
        return 0;
      }
    },
    node_find_by_name(namePtr: number, byteLength: number) {
      const node = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteNode, namePtr, byteLength);
      return node ? node.eid : 0;
    },
    node_add_child(nodeId: number, childId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteNode, childId);

      if (!child) {
        return -1;
      }

      addChild(node, child);

      return 0;
    },
    node_remove_child(nodeId: number, childId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteNode, childId);

      if (!child) {
        return -1;
      }

      removeChild(node, child);

      return 0;
    },
    node_child_count(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return getScriptChildCount(wasmCtx, node);
    },
    node_get_children(nodeId: number, childArrPtr: number, maxCount: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return getScriptChildren(wasmCtx, node, childArrPtr, maxCount);
    },
    node_get_child(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      return scriptGetChildAt(wasmCtx, node, index);
    },
    node_get_parent(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const parent = node.parent;

      if (!parent) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(parent.eid)) {
        return 0;
      }

      return parent.eid;
    },
    node_get_parent_scene(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const parentScene = node.parentScene;

      if (!parentScene) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(parentScene.eid)) {
        return 0;
      }

      return parentScene.eid;
    },
    node_get_position(nodeId: number, positionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, positionPtr, node.position);

      return 0;
    },
    node_set_position(nodeId: number, positionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, positionPtr, node.position);

      return 0;
    },
    node_get_quaternion(nodeId: number, quaternionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, quaternionPtr, node.quaternion);

      return 0;
    },
    node_set_quaternion(nodeId: number, quaternionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, quaternionPtr, node.quaternion);

      return 0;
    },
    node_get_scale(nodeId: number, scalePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, scalePtr, node.scale);

      return 0;
    },
    node_set_scale(nodeId: number, scalePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, scalePtr, node.scale);

      return 0;
    },
    node_get_local_matrix(nodeId: number, localMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, localMatrixPtr, node.localMatrix);

      return 0;
    },
    node_set_local_matrix(nodeId: number, localMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, localMatrixPtr, node.localMatrix);

      return 0;
    },
    node_get_world_matrix(nodeId: number, worldMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, worldMatrixPtr, node.worldMatrix);

      return 0;
    },
    node_get_visible(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return node.visible ? 1 : 0;
    },
    node_set_visible(nodeId: number, visible: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.visible = !!visible;

      return 0;
    },
    node_get_is_static(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return node.isStatic ? 1 : 0;
    },
    node_set_is_static(nodeId: number, isStatic: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.isStatic = !!isStatic;

      return 0;
    },
    node_get_mesh(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteMesh, node.mesh);
    },
    node_set_mesh(nodeId: number, meshId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);

      if (!mesh) {
        return -1;
      }

      node.mesh = mesh;

      return 0;
    },
    node_get_light(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteLight, node.light);
    },
    node_set_light(nodeId: number, lightId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      node.light = light;

      return 0;
    },
    create_mesh(primitivesPtr: number, count: number) {},
  };
}

RemoteLight;
